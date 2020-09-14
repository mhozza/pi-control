from django.conf import settings
from scrabbler import scrabbler


class LazyDict:
    _WORD_LISTS = dict()
    _TRIES = dict()
    _loading = False

    def init_all(self):
        if self._loading:
            return
        self._loading = True
        for fname in settings.SCRABBLER_DICTIONARIES:
            self.get_trie(fname)

    def get_word_list(self, dictionary_name):
        if dictionary_name not in self._WORD_LISTS:
            self._WORD_LISTS[dictionary_name] = scrabbler.load_dictionary(
                settings.SCRABBLER_DICTIONARIES[dictionary_name]
            )

        return self._WORD_LISTS[dictionary_name]

    def get_trie(self, dictionary_name):
        if dictionary_name not in self._TRIES:
            self._TRIES[dictionary_name] = scrabbler.build_trie(self.get_word_list(dictionary_name))

        return self._TRIES[dictionary_name]
