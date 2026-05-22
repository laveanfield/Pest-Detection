from pathlib import Path

TRAINING_ROOT = Path(__file__).resolve().parent.parent

#===========================================
# Data
#===========================================

DATA_DIR    = TRAINING_ROOT / "data"
CONFIG_DIR  = TRAINING_ROOT / "config"
MODEL_DIR   = TRAINING_ROOT / "models"

DATASET_ZIP = DATA_DIR / "dataset.zip"
DATASET_DIR = DATA_DIR / "dataset"

# Ensure directories exist
for _d in [DATA_DIR, CONFIG_DIR, MODEL_DIR]:
    _d.mkdir(parents=True, exist_ok=True)

#===========================================
# Training hyperparameters
#===========================================

TRAIN_CONFIG = dict(
    model         = "yolov8m.pt",
    epochs        = 100,
    imgsz         = 640,
    batch         = 4,
    workers       = 4,
    patience      = 30,
    optimizer     = "AdamW",
    lr0           = 0.001,
    lrf           = 0.01,
    weight_decay  = 0.0005,
    cos_lr        = True,
    warmup_epochs = 5,
    augment       = True,
    cache         = False,
    save          = True,
    plots         = True,
    verbose       = True,
    exist_ok      = True,
)

#===========================================
# Augmentation
#===========================================

N_AUGMENT = 3

#===========================================
# Class name
#===========================================

CLASS_NAMES = ["bo to", "bo map", "bo thon"]