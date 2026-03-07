import os
import io
import base64
import tempfile
import numpy as np
import torch
import nibabel as nib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image

from flask import Flask, request, jsonify
from flask_cors import CORS

from monai.networks.nets import UNet
from monai.transforms import (
    Compose,
    LoadImage,
    EnsureChannelFirst,
    Orientation,
    Spacing,
    NormalizeIntensity,
    Activations,
    AsDiscrete,
)
from monai.inferers import sliding_window_inference

# ─── App Setup ───────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = tempfile.mkdtemp()
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500 MB max upload

# ─── Device & Model ─────────────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'Trained_Model', 'best_metric_model.pth')

model = UNet(
    spatial_dims=3,
    in_channels=4,
    out_channels=3,
    channels=(16, 32, 64, 128, 256),
    strides=(2, 2, 2, 2),
    num_res_units=2,
).to(device)

model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()
print(f"✅ Model loaded from {MODEL_PATH} on {device}")

# ─── Transforms (for single pre-stacked 4-channel file) ─────────────────────
preprocess = Compose([
    LoadImage(image_only=True),
    EnsureChannelFirst(),
    Orientation(axcodes="RAS"),
    Spacing(pixdim=(1.0, 1.0, 1.0), mode="bilinear"),
    NormalizeIntensity(nonzero=True, channel_wise=True),
])

# Transform for individual modality files (each is single-channel)
preprocess_single = Compose([
    LoadImage(image_only=True),
    EnsureChannelFirst(),
    Orientation(axcodes="RAS"),
    Spacing(pixdim=(1.0, 1.0, 1.0), mode="bilinear"),
])

post_trans = Compose([
    Activations(sigmoid=True),
    AsDiscrete(threshold=0.5),
])

# ─── Helpers ─────────────────────────────────────────────────────────────────
CHANNEL_COLORS = [
    (0.93, 0.26, 0.26),   # TC - Tumor Core (red)
    (0.18, 0.80, 0.44),   # WT - Whole Tumor (green)
    (0.20, 0.60, 0.96),   # ET - Enhancing Tumor (blue)
]
CHANNEL_NAMES = ["Tumor Core (TC)", "Whole Tumor (WT)", "Enhancing Tumor (ET)"]


def tensor_slice_to_base64(arr, cmap='gray', vmin=None, vmax=None):
    """Convert a 2D numpy array to a base64-encoded PNG string."""
    fig, ax = plt.subplots(1, 1, figsize=(3, 3), dpi=100)
    ax.imshow(arr, cmap=cmap, vmin=vmin, vmax=vmax, origin='lower')
    ax.axis('off')
    fig.tight_layout(pad=0)
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


def create_overlay(mri_slice, seg_slice, color, alpha=0.45):
    """Create an overlay of a segmentation mask on an MRI slice."""
    if mri_slice.max() > mri_slice.min():
        mri_norm = (mri_slice - mri_slice.min()) / (mri_slice.max() - mri_slice.min())
    else:
        mri_norm = np.zeros_like(mri_slice)

    rgb = np.stack([mri_norm] * 3, axis=-1)

    mask = seg_slice > 0.5
    for c in range(3):
        rgb[:, :, c] = np.where(mask, rgb[:, :, c] * (1 - alpha) + color[c] * alpha, rgb[:, :, c])

    fig, ax = plt.subplots(1, 1, figsize=(3, 3), dpi=100)
    ax.imshow(rgb, origin='lower')
    ax.axis('off')
    fig.tight_layout(pad=0)
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


def merge_modalities(flair_path, t1_path, t1ce_path, t2_path):
    """Load 4 separate modality NIfTI files and merge into a single 4-channel tensor."""
    channels = []
    for path in [flair_path, t1_path, t1ce_path, t2_path]:
        img = preprocess_single(path)  # shape: (1, H, W, D)
        channels.append(img)

    # Stack along channel dim → (4, H, W, D)
    merged = torch.cat(channels, dim=0)

    # Normalize intensity per channel
    normalizer = NormalizeIntensity(nonzero=True, channel_wise=True)
    merged = normalizer(merged)

    return merged


def generate_response(img_tensor, output, slice_idx, filename):
    """Generate the JSON response with all image data for a given slice."""
    num_channels = output.shape[0]
    depth = output.shape[-1]
    input_channels = img_tensor.shape[1]

    slice_idx = max(0, min(slice_idx, depth - 1))

    # MRI background (first channel = FLAIR)
    mri_slice = img_tensor[0, 0, :, :, slice_idx].detach().cpu().numpy()
    mri_b64 = tensor_slice_to_base64(mri_slice, cmap='gray')

    # Compute detection stats across the entire volume
    detection_stats = []
    for ch in range(num_channels):
        ch_volume = output[ch].detach().cpu().numpy()
        pixel_count = int((ch_volume > 0.5).sum())
        total_pixels = int(ch_volume.size)
        detection_stats.append({
            "name": CHANNEL_NAMES[ch],
            "detected": pixel_count > 0,
            "pixel_count": pixel_count,
            "percentage": round((pixel_count / total_pixels) * 100, 4) if total_pixels > 0 else 0,
        })

    tumor_detected = any(d["detected"] for d in detection_stats)

    seg_channels = []
    for ch in range(num_channels):
        seg_slice = output[ch, :, :, slice_idx].detach().cpu().numpy()
        seg_b64 = tensor_slice_to_base64(seg_slice, cmap='hot', vmin=0, vmax=1)
        overlay_b64 = create_overlay(mri_slice, seg_slice, CHANNEL_COLORS[ch])
        seg_channels.append({
            "name": CHANNEL_NAMES[ch],
            "segmentation": seg_b64,
            "overlay": overlay_b64,
            "detected": detection_stats[ch]["detected"],
            "pixel_count": detection_stats[ch]["pixel_count"],
            "percentage": detection_stats[ch]["percentage"],
        })

    input_modalities = []
    modality_names = ["FLAIR", "T1", "T1ce", "T2"]
    for ch in range(min(input_channels, 4)):
        mod_slice = img_tensor[0, ch, :, :, slice_idx].detach().cpu().numpy()
        mod_b64 = tensor_slice_to_base64(mod_slice, cmap='gray')
        input_modalities.append({
            "name": modality_names[ch] if ch < len(modality_names) else f"Channel {ch}",
            "image": mod_b64,
        })

    return {
        "success": True,
        "filename": filename,
        "mri_slice": mri_b64,
        "segmentation_channels": seg_channels,
        "input_modalities": input_modalities,
        "current_slice": slice_idx,
        "total_slices": depth,
        "input_shape": list(img_tensor.shape),
        "output_shape": list(output.shape),
        "tumor_detected": tumor_detected,
        "detection_stats": detection_stats,
    }


def run_inference(img_tensor):
    """Run sliding window inference and post-processing."""
    img_tensor = img_tensor.unsqueeze(0).to(device) if img_tensor.dim() == 4 else img_tensor.to(device)

    with torch.no_grad():
        output = sliding_window_inference(
            inputs=img_tensor,
            roi_size=(128, 128, 64),
            sw_batch_size=1,
            predictor=model,
            overlap=0.5,
        )
        output = post_trans(output[0])  # shape: (3, H, W, D)

    return img_tensor, output


def cleanup_files(*paths):
    """Remove temporary files."""
    for p in paths:
        try:
            if p and os.path.exists(p):
                os.remove(p)
        except OSError:
            pass


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model_loaded": True})


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Supports two upload modes:
    1. Single file:  form field 'file' with a pre-stacked 4-channel NIfTI
    2. Four files:   form fields 'flair', 't1', 't1ce', 't2' with individual modality NIfTIs
    """
    saved_paths = []

    try:
        upload_mode = request.form.get('mode', 'auto')  # 'single', 'multi', or 'auto'

        has_single = 'file' in request.files and request.files['file'].filename != ''
        has_multi = all(
            key in request.files and request.files[key].filename != ''
            for key in ['flair', 't1', 't1ce', 't2']
        )

        if upload_mode == 'multi' or (upload_mode == 'auto' and has_multi):
            # ── Mode: 4 separate modality files ──
            print("📂 Mode: 4 separate modality files")
            modality_paths = {}
            for key in ['flair', 't1', 't1ce', 't2']:
                if key not in request.files:
                    return jsonify({"error": f"Missing modality file: {key}"}), 400
                f = request.files[key]
                path = os.path.join(app.config['UPLOAD_FOLDER'], f"{key}_{f.filename}")
                f.save(path)
                modality_paths[key] = path
                saved_paths.append(path)
                print(f"  📁 {key}: {f.filename}")

            # Merge into 4-channel tensor
            img_tensor = merge_modalities(
                modality_paths['flair'],
                modality_paths['t1'],
                modality_paths['t1ce'],
                modality_paths['t2'],
            )
            filename = "merged_" + request.files['flair'].filename

        elif upload_mode == 'single' or (upload_mode == 'auto' and has_single):
            # ── Mode: single pre-stacked file ──
            print("📂 Mode: single pre-stacked file")
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "Empty filename"}), 400

            allowed_ext = ('.nii', '.nii.gz')
            if not any(file.filename.lower().endswith(ext) for ext in allowed_ext):
                return jsonify({"error": "Only NIfTI files (.nii, .nii.gz) are supported"}), 400

            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)
            saved_paths.append(filepath)
            print(f"  📁 {file.filename}")

            img_tensor = preprocess(filepath)
            filename = file.filename

            # If single-channel file, warn but still try (repeat channel 4x for testing)
            if img_tensor.shape[0] == 1:
                print("⚠️  Single-channel input detected, repeating to 4 channels for compatibility")
                img_tensor = img_tensor.repeat(4, 1, 1, 1)

        else:
            return jsonify({
                "error": "No files provided. Upload either a single 4-channel NIfTI file (field: 'file') "
                         "or 4 separate modality files (fields: 'flair', 't1', 't1ce', 't2')."
            }), 400

        print(f"📐 Input shape: {img_tensor.shape}")

        # Ensure we have 4 channels
        if img_tensor.shape[0] != 4:
            return jsonify({
                "error": f"Expected 4 input channels (FLAIR, T1, T1ce, T2) but got {img_tensor.shape[0]}. "
                         f"Please upload 4 separate modality files or a pre-stacked 4-channel NIfTI."
            }), 400

        # Run inference
        img_tensor, output = run_inference(img_tensor)
        print(f"📊 Output shape: {output.shape}")

        # Get requested slice
        slice_idx = request.form.get('slice_idx', None)
        if slice_idx is not None:
            slice_idx = int(slice_idx)
        else:
            slice_idx = output.shape[-1] // 2

        result = generate_response(img_tensor, output, slice_idx, filename)

        cleanup_files(*saved_paths)
        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        cleanup_files(*saved_paths)
        return jsonify({"error": str(e)}), 500


# ─── Main ────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
