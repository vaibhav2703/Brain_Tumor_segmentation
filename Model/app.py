from flask import Flask, request, render_template
import torch
import monai
# from utils import preprocess_input, postprocess_output
from utils import preprocess_input, postprocess_output
from monai.networks.nets import UNet
import os


app = Flask(__name__)
app.template_folder = 'templates'

# Load the model and set it to evaluation mode
device = torch.device("cpu")
model = UNet(spatial_dims=3, in_channels=4, out_channels=3, channels=(16, 32, 64, 128, 256), strides=(2, 2, 2, 2), num_res_units=2).to(device)
model_path = os.path.join('App/Model', 'best_metric_model.pth')
model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
model.eval()

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Get the uploaded image
        image = request.files['image']
        
        # Preprocess the input
        input_tensor = preprocess_input(image)
        
        # Run inference
        with torch.no_grad():
            output = inference(input_tensor)
        
        # Postprocess the output
        output_image = postprocess_output(output)
        
        # Render the result
        return render_template('result.html', output_image=output_image)

    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)