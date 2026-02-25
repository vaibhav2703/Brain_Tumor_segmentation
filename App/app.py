import io
import os
import tempfile
import base64
from flask import Flask, request, jsonify, send_file
import numpy as np
from PIL import Image
import monai.deploy as torch_deploy
from monai.transforms import (
    LoadImaged,
    EnsureChannelFirstd,
    EnsureTyped,
    Spacingd,
    Compose,
    Orientationd,
    ScaleIntensityRanged,
    ToTensord,
)

class BrainTumorSegmentationModel:
    def __init__(self, model_path):
        self.model = torch_deploy.TorchModel(model_path)

    def preprocess(self, image_data):
        transforms = Compose(
            [
                LoadImaged(keys=["image"]),
                EnsureChannelFirstd(keys="image"),
                EnsureTyped(keys="image"),
                Spacingd(
                    keys=["image"],
                    pixdim=(1.0, 1.0, 1.0),
                    mode=("bilinear", "nearest"),
                ),
                Orientationd(keys=["image"], axcodes="RAS"),
                ScaleIntensityRanged(
                    keys="image", a_min=0.0, a_max=255.0, b_min=0.0, b_max=1.0, clip=True,
                ),
                ToTensord(keys="image"),
            ]
        )
        return transforms(image_data)

    def predict(self, image_data):
        input_dict = self.preprocess(image_data)
        output_dict = self.model.infer(input_dict)
        return output_dict

app = Flask(__name__)
# model_path = "Model/best_metric_model.pth"
model_path = "Model/best_metric_model.pth"
model = BrainTumorSegmentationModel(model_path)

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return "No file part"
    file = request.files["file"]
    if file.filename == "":
        return "No selected file"
    if file:
        img = Image.open(file)
        img_data = np.array(img)
        output_dict = model.predict({"image": img_data})
        # post-processing and conversion to base64 string goes here
        return send_file(
            io.BytesIO(base64.b64encode(output_dict["image"])),
            mimetype="image/png",
            as_attachment=True,
            attachment_filename="output.png",
        )

if __name__ == "__main__":
    app.run(debug=True)