import zipfile
from pathlib import Path


def unzip_files(zip_path: Path, extract_to: Path) -> None:
    zip_path = Path(zip_path)
    extract_to = Path(extract_to)

    if extract_to.exists() and any(extract_to.iterdir()):
        print(f"{extract_to} already exists. Skipping unzip.")
        return

    if not zip_path.exists():
        raise FileNotFoundError(f"{zip_path} not found.")

    extract_to.mkdir(parents=True, exist_ok=True)

    print(f"Extracting...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_to)
    print("Done!")


def verify_dataset(dataset_dir: Path, splits: list[str] = ["train", "val", "test"]) -> None:
    dataset_dir = Path(dataset_dir)
    print("Verifying...")

    all_ok = True
    for split in splits:
        img_dir = dataset_dir / "images" / split
        lbl_dir = dataset_dir / "labels" / split

        imgs   = list(img_dir.glob("*.jpg")) + list(img_dir.glob("*.png")) if img_dir.exists() else []
        labels = list(lbl_dir.glob("*.txt")) if lbl_dir.exists() else []

        status = "OK" if imgs and labels else "ERROR"
        if not imgs or not labels:
            all_ok = False

        print(f"{status} {split:5s} --> images: {len(imgs):5d} | labels: {len(labels):5d}")

    print()
    if all_ok:
        print("Dataset is valid.")
    else:
        print("WARNING!!! Some splits are missing images or labels.")