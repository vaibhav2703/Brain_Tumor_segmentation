from glob import glob
import shutil 
import os
import dicom2nifti
import nibabel as nib
import numpy as np
import torch

from monai.transforms import (
    Compose,
    EnsureChannelFirstd,
    LoadImaged,
    Resized,
    ToTensord,
    Spacingd,
    Orientationd,
    ScaleIntensityRanged,
    CropForegroundd,

)

# from monai.transforms import (
#     Activations,
#     Activationsd,
#     AsDiscrete,
#     AsDiscreted,
#     Compose,
#     ToTensord,
#     Invertd,
#     LoadImaged,
#     MapTransform,
#     NormalizeIntensityd,
#     Orientationd,
#     RandFlipd,
#     RandScaleIntensityd,
#     RandShiftIntensityd,
#     RandSpatialCropd,
#     Spacingd,
#     EnsureTyped,
#     EnsureChannelFirstd,
# )

from monai.data import DataLoader, Dataset, CacheDataset
from monai.utils import set_determinism
from monai.utils import first
from monai.transforms import PadListDataCollate
import matplotlib.pyplot as plt
from tqdm import tqdm

# class ConvertToMultiChannelBasedOnBratsClassesd(MapTransform):
#     """
#     Convert labels to multi channels based on brats classes:
#     label 1 is the peritumoral edema
#     label 2 is the GD-enhancing tumor
#     label 3 is the necrotic and non-enhancing tumor core
#     The possible classes are TC (Tumor core), WT (Whole tumor)
#     and ET (Enhancing tumor).

#     """

#     def __call__(self, data):
#         d = dict(data)
#         for key in self.keys:
#             result = []
#             # merge label 2 and label 3 to construct TC
#             result.append(torch.logical_or(d[key] == 2, d[key] == 3))
#             # merge labels 1, 2 and 3 to construct WT
#             result.append(torch.logical_or(torch.logical_or(d[key] == 2, d[key] == 3), d[key] == 1))
#             # label 2 is ET
#             result.append(d[key] == 2)
#             d[key] = torch.stack(result, axis=0).float()
#         return d

# def prepare(data_dir, cache=False):
#     set_determinism(seed=0)

#     train_images = sorted(glob(os.path.join(data_dir, 'TrainVolumes', '*.nii.gz')))
#     train_labels = sorted(glob(os.path.join(data_dir, 'TrainSegmentation', '*.nii.gz')))

#     val_images = sorted(glob(os.path.join(data_dir, 'TestVolumes', '*.nii.gz')))
#     val_labels = sorted(glob(os.path.join(data_dir, 'TestSegmentation', '*.nii.gz')))

#     train_files = [{"image":image_name, "label":label_name} for image_name, label_name in zip(train_images, train_labels)]
#     val_files = [{"image":image_name, "label":label_name} for image_name, label_name in zip(val_images, val_labels)]

#     train_transforms = Compose(
#         [
#             # load 4 Nifti images and stack them together
#             LoadImaged(keys=["image", "label"]),
#             EnsureChannelFirstd(keys="image"),
#             EnsureTyped(keys=["image", "label"]),
#             ConvertToMultiChannelBasedOnBratsClassesd(keys="label"),
#             Orientationd(keys=["image", "label"], axcodes="RAS"),
#             Spacingd(
#                 keys=["image", "label"],
#                 pixdim=(1.0, 1.0, 1.0),
#                 mode=("bilinear", "nearest"),
#             ),
#             RandSpatialCropd(keys=["image", "label"], roi_size=[224, 224, 144], random_size=False),
#             RandFlipd(keys=["image", "label"], prob=0.5, spatial_axis=0),
#             RandFlipd(keys=["image", "label"], prob=0.5, spatial_axis=1),
#             RandFlipd(keys=["image", "label"], prob=0.5, spatial_axis=2),
#             NormalizeIntensityd(keys="image", nonzero=True, channel_wise=True),
#             RandScaleIntensityd(keys="image", factors=0.1, prob=1.0),
#             RandShiftIntensityd(keys="image", offsets=0.1, prob=1.0),
#             ToTensord(keys=['image', 'label'])
#         ]
#     )
#     test_transforms = Compose(
#         [
#             LoadImaged(keys=["image", "label"]),
#             EnsureChannelFirstd(keys="image"),
#             EnsureTyped(keys=["image", "label"]),
#             ConvertToMultiChannelBasedOnBratsClassesd(keys="label"),
#             Orientationd(keys=["image", "label"], axcodes="RAS"),
#             Spacingd(
#                 keys=["image", "label"],
#                 pixdim=(1.0, 1.0, 1.0),
#                 mode=("bilinear", "nearest"),
#             ),
#             NormalizeIntensityd(keys="image", nonzero=True, channel_wise=True),
#             ToTensord(keys=['image', 'label'])
#         ]
#     )
#     if cache:
#         train_ds = CacheDataset(data=train_files, transform=train_transforms, cache_rate=1.0)
#         train_loader = DataLoader(train_ds, batch_size=1)

#         val_ds = CacheDataset(data=val_files, transform=test_transforms, cache_rate=1.0)
#         val_loader = DataLoader(val_ds, batch_size=1)

#         return train_loader, val_loader

#     else:
#         train_ds = Dataset(data = train_files, transform=train_transforms)
#         train_loader = DataLoader(train_ds, batch_size=1)

#         val_ds = Dataset(data = val_files, transform=test_transforms)
#         val_loader = DataLoader(val_ds, batch_size=1)
#         # post_trans = Compose([Activations(sigmoid=True), AsDiscrete(threshold=0.5)])


#         return train_loader, val_loader





def prepare(data_dir, cache=False):
    set_determinism(seed=0)

    train_images = sorted(glob(os.path.join(data_dir, 'TrainVolumes', '*.nii.gz')))
    train_labels = sorted(glob(os.path.join(data_dir, 'TrainSegmentation', '*.nii.gz')))

    val_images = sorted(glob(os.path.join(data_dir, 'TestVolumes', '*.nii.gz')))
    val_labels = sorted(glob(os.path.join(data_dir, 'TestSegmentation', '*.nii.gz')))

    train_files = [{"image":image_name, "label":label_name} for image_name, label_name in zip(train_images, train_labels)]
    val_files = [{"image":image_name, "label":label_name} for image_name, label_name in zip(val_images, val_labels)]

    if len(train_images) != len(train_labels):
        print(f"Warning: Number of training images ({len(train_images)}) does not match number of training labels ({len(train_labels)})")
        train_files = train_files[:min(len(train_images), len(train_labels))]

    if len(val_images) != len(val_labels):
        print(f"Warning: Number of validation images ({len(val_images)}) does not match number of validation labels ({len(val_labels)})")
        val_files = val_files[:min(len(val_images), len(val_labels))]

    train_transforms = Compose(
        [
            # first
            LoadImaged(keys=['image', 'label']),
            EnsureChannelFirstd(keys=["image", "label"]),
            Spacingd(keys=['image', 'label'], pixdim=(1.5, 1.5, 2.0)),
            ScaleIntensityRanged(keys='image', a_min=233.0, a_max=1010.6, b_min=0.0, b_max=1.0, clip=True),
            CropForegroundd(keys=['image', 'label'],source_key='image'),
            Resized(keys='image', spatial_size=[128, 128, 155]),
            ToTensord(keys=['image', 'label']) #last
        ]
    )

    test_transforms = Compose(
        [
            LoadImaged(keys=['image','label']),
            EnsureChannelFirstd(keys=["image", "label"]),
            Spacingd(keys=['image', 'label'], pixdim=(1.5, 1.5, 2.0)),
            ScaleIntensityRanged(keys='image', a_min=233.0, a_max=1010.6, b_min=0.0, b_max=1.0, clip=True),
            CropForegroundd(keys=['image', 'label'], source_key='image'),
            Resized(keys='image', spatial_size=[128, 128, 155]),
            ToTensord(keys=['image', 'label'])

        ]
    )
    if cache:
        train_ds = CacheDataset(data=train_files, transform=train_transforms, cache_rate=1.0)
        train_loader = DataLoader(train_ds, batch_size=1)

        val_ds = CacheDataset(data=val_files, transform=test_transforms, cache_rate=1.0)
        val_loader = DataLoader(val_ds, batch_size=1)

        return train_loader, val_loader

    else:
        train_ds = Dataset(data = train_files, transform=train_transforms)
        train_loader = DataLoader(train_ds, batch_size=1)

        val_ds = Dataset(data = val_files, transform=test_transforms)
        val_loader = DataLoader(val_ds, batch_size=1)


        return train_loader, val_loader



# train_transforms = Compose([
    #     LoadImaged(keys=['image', 'label']),
    #     ScaleIntensityRanged(keys='image', a_min=233.0, a_max=1010.6, b_min=0.0, b_max=1.0, clip=True),
    #     Resized(keys='image', spatial_size=[128, 128, 155]),
    #     ToTensord(keys=['image']),
    #     Resized(keys='label', spatial_size=[128, 128, 155], mode='nearest'),
    #     ToTensord(keys=['label'])
    # ])

    # test_transforms = Compose([
    #     LoadImaged(keys=['image', 'label']),
    #     ScaleIntensityRanged(keys='image', a_min=233.0, a_max=1010.6, b_min=0.0, b_max=1.0, clip=True),
    #     Resized(keys='image', spatial_size=[128, 128, 155]),
    #     ToTensord(keys=['image']),
    #     Resized(keys='label', spatial_size=[128, 128, 155], mode='nearest'),
    #     ToTensord(keys=['label'])
    # ])

    # if cache:
    #     train_ds = CacheDataset(data=train_files, transform=train_transforms, cache_rate=1.0)
    #     val_ds = CacheDataset(data=val_files, transform=test_transforms, cache_rate=1.0)
    # else:
    #     train_ds = Dataset(data=train_files, transform=train_transforms)
    #     val_ds = Dataset(data=val_files, transform=test_transforms)

    # return train_ds, val_ds
