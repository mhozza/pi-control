from enum import Enum

from crispy_forms.bootstrap import InlineRadios
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Div, Field, Layout, Row, Submit
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
    wildcard = forms.BooleanField(label="Wildcard (?)", initial=True, required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.layout = Layout(
            Row(
                Div("prefix", css_class="col-md-3"),
                Div(Field("word", autofocus="true"), css_class="col-md-6"),
                Div("dictionary", css_class="col-md-3"),
            ),
            Row(
                Div(InlineRadios("mode"), css_class="col-md-3"),
                Div("limit", css_class="col-md-3"),
                Div(
                    Field("use_all_letters", css_class="custom-checkbox-inline"),
                    css_class="col-md-3",
                ),
                Div("wildcard", css_class="col-md-3"),
                css_class="form-row align-items-center",
            ),
            Row(Submit("submit", "Hladaj", css_class="btn btn-success col-md-12")),
        )
