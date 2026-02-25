from flask import Flask, request, jsonify
import nibabel as nib
import pydicom
import numpy as np
from flask_cors import CORS
from monai.networks.nets import UNet
import torch
from monai.transforms import Compose, LoadImage, EnsureChannelFirstd, EnsureTyped, Orientationd, Spacingd, NormalizeIntensityd, AsDiscrete, Activations

app = Flask(__name__)
device = torch.device("cpu")
# Define your preprocessing transform
inference_transform = Compose(
    [
        LoadImage(image_only=True),
        EnsureChannelFirstd(keys="image"),
        EnsureTyped(keys=["image"]),
        Orientationd(keys=["image"], axcodes="RAS"),
        Spacingd(keys=["image"], pixdim=(1.0, 1.0, 1.0), mode="bilinear"),
        NormalizeIntensityd(keys="image", nonzero=True, channel_wise=True),
    ]
)


# Load your trained model
model_path = "Model/best_metric_model.pth"

# Load the model
model = UNet(spatial_dims=3, in_channels=4, out_channels=3, channels=(16, 32, 64, 128, 256), strides=(2, 2, 2, 2), num_res_units=2).to(device)
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()

@app.route("/predict", methods=["POST"])
def predict():
    # Get uploaded NIfTI file
    file = request.files["file"]
    
    # Preprocess the image
    img_tensor = inference_transform(file)
    img_tensor = img_tensor.unsqueeze(0).to(device)

    # Perform inference
    with torch.no_grad():
        output = model(inference_transform.to(device))  # Use your inference function
        output = post_trans(output[0])  # Apply post-processing

    # Convert output to suitable format for visualization (e.g., NumPy array)
    output_array = output.detach().cpu().numpy()

    # ... (process output_array for visualization)
    
    # Return the segmentation results
    return jsonify({"segmentation": ...})  # Encode the output appropriately

if __name__ == "__main__":
    app.run(debug=True)