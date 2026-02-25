import os
import shutil
import tempfile
import time
import matplotlib.pyplot as plt
from monai.apps import DecathlonDataset
from monai.config import print_config
from monai.data import DataLoader, Dataset
from monai.handlers.utils import from_engine
from monai.losses import DiceLoss
from monai.inferers import sliding_window_inference
from monai.metrics import DiceMetric
# from monai.networks.nets import SegResNet
from monai.networks.nets import UNet
from monai.transforms import (
    Activations,
    Activationsd,
    AsDiscrete,
    AsDiscreted,
    Compose,
    Invertd,
    LoadImaged,
    MapTransform,
    NormalizeIntensityd,
    Orientationd,
    RandFlipd,
    RandScaleIntensityd,
    RandShiftIntensityd,
    RandSpatialCropd,
    Spacingd,
    EnsureTyped,
    EnsureChannelFirstd,
)
from monai.utils import set_determinism
from glob import glob
import torch

class ConvertToMultiChannelBasedOnBratsClassesd(MapTransform):
    def __call__(self, data):
        d = dict(data)
        for key in self.keys:
            result = []
            # merge label 2 and label 3 to construct TC
            result.append(torch.logical_or(d[key] == 2, d[key] == 3))
            # merge labels 1, 2 and 3 to construct WT
            result.append(torch.logical_or(torch.logical_or(d[key] == 2, d[key] == 3), d[key] == 1))
            # label 2 is ET
            result.append(d[key] == 2)
            d[key] = torch.stack(result, axis=0).float()
        return d

def preprocess(file_path):
    set_determinism(seed=0)

    # try:
    #     train_images = [{'image': file_path}]
    #     train_labels = [{'label': file_path}]
    #     val_images = [{'image': file_path}]
    #     val_labels = [{'label': file_path}]
    # except Exception as e:
    #     print(f"Error loading file: {e}")
    #     return None

    # train_files = [{"image": image_name, "label": label_name} for image_name, label_name in zip(train_images, train_labels)]
    # val_files = [{"image": image_name, "label": label_name} for image_name, label_name in zip(val_images, val_labels)]
    train_images = sorted(glob(os.path.join(file_path, '*.nii.gz')))
    train_labels = sorted(glob(os.path.join(file_path, '*.nii.gz')))

    val_images = sorted(glob(os.path.join(file_path, '*.nii.gz')))
    val_labels = sorted(glob(os.path.join(file_path, '*.nii.gz')))

    train_files = [{"image":image_name ,"label":label_name} for image_name, label_name in zip(train_images, train_labels)]
    val_files = [{"image":image_name ,"label":label_name} for image_name,label_name in zip(val_labels, val_images)]

    train_transform = Compose(
        [
            LoadImaged(keys=["image", "label"]),
            EnsureChannelFirstd(keys="image"),
            EnsureTyped(keys=["image", "label"]),
            ConvertToMultiChannelBasedOnBratsClassesd(keys="label"),
            Orientationd(keys=["image", "label"], axcodes="RAS"),
            Spacingd(keys=["image", "label"], pixdim=(1.0, 1.0, 1.0), mode=("bilinear", "nearest")),
            RandSpatialCropd(keys=["image", "label"], roi_size=[224, 224, 144], random_size=False),
            RandFlipd(keys=["image", "label"], prob=0.5, spatial_axis=0),
            RandFlipd(keys=["image", "label"], prob=0.5, spatial_axis=1),
            RandFlipd(keys=["image", "label"], prob=0.5, spatial_axis=2),
            NormalizeIntensityd(keys="image", nonzero=True, channel_wise=True),
            RandScaleIntensityd(keys="image", factors=0.1, prob=1.0),
            RandShiftIntensityd(keys="image", offsets=0.1, prob=1.0),
        ]
    )
    val_transform = Compose(
        [
            LoadImaged(keys=["label"]),
            EnsureChannelFirstd(keys="image"),
            EnsureTyped(keys=["label"]),
            ConvertToMultiChannelBasedOnBratsClassesd(keys="label"),
            Orientationd(keys=["label"], axcodes="RAS"),
            Spacingd(keys=["label"], pixdim=(1.0, 1.0, 1.0), mode=("bilinear")),
            NormalizeIntensityd(keys="image", nonzero=True, channel_wise=True),
        ]
    )

    # train_ds = Dataset(data=train_files, transform=train_transform)
    # train_loader = DataLoader(train_ds, batch_size=1)
    val_ds = Dataset(data=val_files, transform=val_transform)
    val_loader = DataLoader(val_ds, batch_size=1,shuffle=False, num_workers=4)

    device = torch.device("cpu")
    model = UNet(
        spatial_dims=3,
        in_channels=4,
        out_channels=3,
        channels=(16, 32, 64, 128, 256),
        strides=(2, 2, 2, 2),
        num_res_units=2,
    ).to(device)

    post_trans = Compose([Activations(sigmoid=True), AsDiscrete(threshold=0.5)])

    VAL_AMP=True
    def inference(input):
        def _compute(input):
            return sliding_window_inference(
                inputs=input,
                roi_size=(240, 240, 160),
                sw_batch_size=1,
                predictor=model,
                overlap=0.5,
            )

        if VAL_AMP:
            with torch.cuda.amp.autocast():
                return _compute(input)
        else:
            return _compute(input)
        
    model.load_state_dict(torch.load(os.path.join("Model", "best_metric_model.pth"), map_location=torch.device('cpu')))
    model.eval()

    with torch.no_grad():
        # select one image to evaluate and visualize the model output
        val_input = val_ds[0]["image"].unsqueeze(0).to(device)
        roi_size = (128, 128, 64)
        sw_batch_size = 4
        val_output = inference(val_input)
        val_output = post_trans(val_output[0])

        plt.figure("output", (18, 6))
        for i in range(3):
            plt.subplot(1, 3, i + 1)
            plt.title(f"output channel {i}")
            plt.imshow(val_output[i, :, :, 70].detach().cpu().numpy())
        plt.show()

    # return result

if __name__ == "__main__":
    """
    Run on a test case
    """
    path = "D:/Brain_Data/TrainVolumes" 
    seg = preprocess(path)