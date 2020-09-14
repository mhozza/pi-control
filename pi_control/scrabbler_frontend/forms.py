from enum import Enum

from django import forms
from django.conf import settings
from django.forms import RadioSelect


class Mode(Enum):
    PERMUTATIONS = 0
    REGEX = 1


class ScrabblerForm(forms.Form):
    dictionary = forms.ChoiceField(
        label="Slovnik", choices=((k, k) for k in sorted(settings.SCRABBLER_DICTIONARIES.keys()))
    )
    word = forms.CharField(label="Slovo", max_length=100)
    mode = forms.ChoiceField(
        label="Mod",
        widget=RadioSelect,
        initial=Mode.PERMUTATIONS,
        choices=((Mode.PERMUTATIONS, "Permutacie"), (Mode.REGEX, "Regex")),
    )
    limit = forms.IntegerField(label="Limit", max_value=50, initial=20)
    prefix = forms.CharField(label="Prefix", max_length=100, required=False)
    use_all_letters = forms.BooleanField(label="Pouzi vsetky pismena", initial=True, required=False)
    wildcard = forms.BooleanField(label="Wildchar", initial=False, required=False)
