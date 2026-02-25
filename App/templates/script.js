const form = document.getElementById('upload-form');
const inputImageContainer = document.getElementById('input-image-container');
const outputImageContainer = document.getElementById('output-image-container');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const response = await fetch(`{{ url_for('index') }}`, {
    method: 'POST',
    body: formData
    });

    const data = await response.json();
    if (response.ok) {
    // Display the input image channels
    const inputImageChannel0 = document.getElementById('input-image-channel-0');
    const inputImageChannel1 = document.getElementById('input-image-channel-1');
    const inputImageChannel2 = document.getElementById('input-image-channel-2');
    const inputImageChannel3 = document.getElementById('input-image-channel-3');

    inputImageChannel0.src = `data:image/png;base64,${data.input_image[0]}`;
    inputImageChannel1.src = `data:image/png;base64,${data.input_image[1]}`;
    inputImageChannel2.src = `data:image/png;base64,${data.input_image[2]}`;
    inputImageChannel3.src = `data:image/png;base64,${data.input_image[3]}`;

    inputImageContainer.style.display = 'flex';

    // Display the output image channels
    const outputImageChannel0 = document.getElementById('output-image-channel-0');
    const outputImageChannel1 = document.getElementById('output-image-channel-1');
    const outputImageChannel2 = document.getElementById('output-image-channel-2');

    outputImageChannel0.src = `data:image/png;base64,${data.output_channels[0]}`;
    outputImageChannel1.src = `data:image/png;base64,${data.output_channels[1]}`;
    outputImageChannel2.src = `data:image/png;base64,${data.output_channels[2]}`;

    outputImageContainer.style.display = 'flex';
    } else {
    alert(data.error);
    }
});