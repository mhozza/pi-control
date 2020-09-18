import json
import logging

import requests
from cachetools import TTLCache, cached
from django.conf import settings

logger = logging.getLogger(__name__)


class ScrabblerClient:
    _url = settings.SCRABBLER_URL

    PERMUTATIONS_PATH = "/permutations"
    REGEX_PATH = "/regex"
    GET_DICTS_PATH = "/dicts"

    @staticmethod
    def _decode_response(response):
        if response.status_code == 200:
            return json.loads(response.content)
        else:
            logger.error(response.content)
            return None

    @cached(cache=TTLCache(maxsize=1, ttl=3600))
    def get_dicts(self):
        return self._decode_response(requests.get(f"{self._url}{self.GET_DICTS_PATH}"))

    def find_permutations(
        self, word, dictionary, limit=None, prefix=None, wildcard=None, use_all_letters=None
    ):
        payload = {"word": word, "dict": dictionary}
        if limit is not None:
            payload["limit"] = limit
        if prefix is not None:
            payload["prefix"] = prefix
        if wildcard is not None:
            payload["wildcard"] = wildcard
        if use_all_letters is not None:
            payload["use_all_letters"] = "true" if use_all_letters else "false"
        logger.warning(payload)
        return self._decode_response(
            requests.get(f"{self._url}{self.PERMUTATIONS_PATH}", params=payload)
        )

    def find_regex(self, regex, dictionary, limit=None):
        payload = {"word": regex, "dict": dictionary}
        if limit is not None:
            payload["limit"] = limit
        return self._decode_response(requests.get(f"{self._url}{self.REGEX_PATH}", params=payload))
