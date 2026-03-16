import json
from deepdiff import DeepDiff


def diff_policies(original_policy: dict, updated_policy: dict) -> dict:
    diff = DeepDiff(
        original_policy,
        updated_policy,
        ignore_order=True
    )

    # Convert DeepDiff → dict → pure JSON-safe object
    diff_dict = diff.to_dict()

    safe_diff = json.loads(
        json.dumps(diff_dict, default=str)
    )

    return {
        "added": safe_diff.get("dictionary_item_added", []),
        "removed": safe_diff.get("dictionary_item_removed", []),
        "values_changed": safe_diff.get("values_changed", {}),
        "type_changes": safe_diff.get("type_changes", {}),
    }
