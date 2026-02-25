import monai
from monai.networks.nets import UNet
from monai.utils import set_determinism
# from monai.utils import decollate_batch
from monai.metrics import DiceMetric
from monai.losses import DiceLoss
from monai.inferers import sliding_window_inference
import torch
from torch.utils.data import DataLoader
import os
from preprocess import prepare

set_determinism(seed=0)

data_dir = 'D:\Brain_Data'
model_dir = 'D:\Brain_Tumor_Segmentation\Model'
train_loader, val_loader = prepare(data_dir)

device = torch.device("cpu")

# model = monai.networks.nets.UNet(
#     spatial_dims=3,
#     in_channels=1,
#     out_channels=3,
#     channels=(16, 32, 64, 128, 256),
#     strides=(2, 2, 2, 2),
#     num_res_units=2,
# ).to(device)

model = monai.networks.nets.UNet(
    spatial_dims=3,
    in_channels=4,  # Change this to match the number of channels in your input data
    out_channels=3,
    channels=(16, 32, 64, 128, 256),
    strides=(2, 2, 2, 2),
    num_res_units=2,
).to(device)

def decollate_batch(batch):
    return [item.unsqueeze(0) for item in batch]

def dice_metric(predicted, target):
    '''
    In this function we take `predicted` and `target` (label) to calculate the dice coeficient then we use it 
    to calculate a metric value for the training and the validation.
    '''
    dice_value = DiceLoss(to_onehot_y=True, sigmoid=True, squared_pred=True)
    value = 1 - dice_value(predicted, target).item()
    return value


loss_fuction=DiceLoss(to_onehot_y = True, sigmoid=True, squared_pred=True)
optimizer = torch.optim.Adam(model.parameters(), 1e-5, weight_decay=1e-5, amsgrad=True)


val_interval = 2
best_metric = -1
best_metric_epoch = -1
max_epochs = 5

# Trianing Loop
for epoch in range(max_epochs):
    print("-" * 10)
    print(f"Epoch {epoch + 1}/{max_epochs}")
    model.train()
    epoch_loss = 0
    step = 0
    for batch_data in train_loader:
        step += 1
        inputs, labels = (
            batch_data["image"].to(device),
            batch_data["label"].to(device),
        )
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = loss_fuction(outputs, labels)
        loss.backward()
        optimizer.step()
        epoch_loss += loss.item()
        print(f"{step}/{len(train_loader)}, train_loss: {loss.item():.4f}")
    epoch_loss /= step
    print(f"Epoch {epoch + 1} average loss: {epoch_loss:.4f}")

    if (epoch + 1) % val_interval == 0:
        model.eval()
        with torch.no_grad():
            metric_sum = 0.0
            metric_count = 0
            for val_data in val_loader:
                val_inputs, val_labels = (
                    val_data["image"].to(device),
                    val_data["label"].to(device),
                )
                roi_size = (96, 96, 96)
                sw_batch_size = 4
                val_outputs = sliding_window_inference(
                    val_inputs, roi_size, sw_batch_size, model
                )
                val_outputs = [monai.networks.utils.map_binary_to_multi_class(val_output, 3) for val_output in decollate_batch(val_outputs)]
                val_outputs = torch.stack(val_outputs).float()
                dice = dice_metric(y_pred=val_outputs, y=val_labels)
                metric_count += len(dice)
                metric_sum += dice.sum().item()
            metric = metric_sum / metric_count
            if metric > best_metric:
                best_metric = metric
                best_metric_epoch = epoch + 1
                model_path = os.path.join(model_dir, "best_metric_model.pth")
                torch.save(model.state_dict(), model_path)
                print(f"Saved new best metric model to {model_path}")
            print(
                f"Current epoch: {epoch + 1} current mean dice: {metric:.4f}"
                f"\nBest mean dice: {best_metric:.4f} at epoch: {best_metric_epoch}"
            )

print(f"Train completed, best_metric: {best_metric:.4f} at epoch: {best_metric_epoch}")
