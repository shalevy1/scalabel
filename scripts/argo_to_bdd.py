"""
Convert argoverse data to bdd data format
"""
import argparse
import json
import os

from scipy.spatial.transform import Rotation


def get_timestamp_from_name(name):
    """
    Get timestamp from argo file name
    """
    return name.split(".")[0].split("_")[-1]


if __name__ == "__main__":
    parser = argparse.ArgumentParser("Convert ArgoVerse data to BDD format")
    parser.add_argument("--labels", help="Directory to labels", required=True)
    parser.add_argument("--items", help="Directory to data", required=True)
    parser.add_argument("--calib", help="Calibration file", required=True)
    parser.add_argument("--camera_name", help="Camera name in calib file")
    parser.add_argument(
        "--url_base",
        help="base url to which item name is appended",
        default="http://localhost:8686",
    )
    parser.add_argument("--output", help="output file", required=True)
    args = parser.parse_args()

    item_names = sorted(os.listdir(args.items))
    label_file_names = sorted(os.listdir(args.labels))

    item_timestamps = set([get_timestamp_from_name(name) for name in item_names])
    label_timestamps = set([get_timestamp_from_name(name) for name in label_file_names])
    timestamps = item_timestamps.union(label_timestamps)

    calibration_data = json.load(open(args.calib, "r"))
    camera_calibration = None
    if args.camera_name:
        for cam_calib in calibration_data["camera_data_"]:
            if cam_calib["key"] == args.camera_name:
                camera_calibration = cam_calib

    item_names = [
        name for name in item_names if get_timestamp_from_name(name) in timestamps
    ]
    uuid_to_id_map = dict()
    categories = set()
    items = []
    for i in range(len(label_file_names)):
        label_file_name = label_file_names[i]
        timestamp = get_timestamp_from_name(label_file_name)
        if timestamp not in timestamps:
            continue

        label_file = open(os.path.join(args.labels, label_file_name), "r")
        argo_labels = json.load(label_file)
        bdd_labels = []

        for label in argo_labels:
            categories.add(label["label_class"])
            uuid = label["track_label_uuid"]
            if uuid not in uuid_to_id_map:
                uuid_to_id_map[uuid] = len(uuid_to_id_map)
            orientation = Rotation.from_quat([
                label["rotation"]["x"],
                label["rotation"]["y"],
                label["rotation"]["z"],
                label["rotation"]["w"],
            ]).as_euler("xyz")
            bdd_labels.append(
                {
                    "id": uuid_to_id_map[uuid],
                    "category": label["label_class"],
                    "manualShape": True,
                    "attributes": {},
                    "box3d": {
                        "center": label["center"],
                        "orientation": {
                            "x": orientation[0],
                            "y": orientation[1],
                            "z": orientation[2]
                        },
                        "size": {
                            "x": label["length"],
                            "y": label["width"],
                            "z": label["height"],
                        },
                    },
                }
            )
        items.append(
            {
                "name": "argo",
                "url": os.path.join(args.url_base, "PC_{}.ply".format(timestamp)),
                "timestamp": timestamp,
                "index": i,
                "labels": bdd_labels,
                "categories": list(categories)
            }
        )

    json.dump(items, open(args.output, "w"))
