from rest_framework.test import APIClient
import json


class JsonAPIClient(APIClient):
    def post(self, path, data, **kwargs):
        json_data = json.dumps(data)
        kwargs.pop("content_type", None)
        return super().post(path, json_data, content_type="application/json", **kwargs)
