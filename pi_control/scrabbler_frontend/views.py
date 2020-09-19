from __future__ import absolute_import

import logging

from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic.edit import FormView

from .forms import Mode, ScrabblerForm
from .scrabbler_client import ScrabblerClient

scrabbler = ScrabblerClient()

logger = logging.getLogger(__name__)


class ScrabblerView(FormView):
    template_name = "scrabbler/scrabbler.html"
    form_class = ScrabblerForm
    success_url = reverse_lazy("scrabbler")

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["dictionaries"] = scrabbler.get_dicts()
        return kwargs

    def form_valid(self, form):
        if form.cleaned_data["mode"] == str(Mode.REGEX.value[0]):
            words = scrabbler.find_regex(
                regex=form.cleaned_data["word"],
                dictionary=form.cleaned_data["dictionary"],
                limit=form.cleaned_data["limit"],
            )
        else:
            words = scrabbler.find_permutations(
                word=form.cleaned_data["word"],
                dictionary=form.cleaned_data["dictionary"],
                use_all_letters=form.cleaned_data["use_all_letters"],
                prefix=form.cleaned_data["prefix"],
                limit=form.cleaned_data["limit"],
                wildcard="?" if form.cleaned_data["wildcard"] else None,
            )
        error = False
        if words is None:
            error = True
        return render(
            self.request, self.template_name, self.get_context_data(words=words, error=error)
        )
