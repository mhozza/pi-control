from __future__ import absolute_import

from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic.edit import FormView
from scrabbler import scrabbler

from .forms import Mode, ScrabblerForm
from .lazy_dict import LazyDict

lazy_dict = LazyDict()


class ScrabblerView(FormView):
    template_name = "scrabbler/scrabbler.html"
    form_class = ScrabblerForm
    success_url = reverse_lazy("scrabbler")

    def form_valid(self, form):
        if form.cleaned_data["mode"] == Mode.REGEX:
            words = scrabbler.find_regex(
                regex=form.cleaned_data["word"],
                words=lazy_dict.get_word_list(form.cleaned_data["dictionary"]),
                limit=form.cleaned_data["limit"],
            )
        else:
            words = scrabbler.find_permutations(
                word=form.cleaned_data["word"],
                trie=lazy_dict.get_trie(form.cleaned_data["dictionary"]),
                use_all_letters=form.cleaned_data["use_all_letters"],
                prefix=form.cleaned_data["prefix"],
                limit=form.cleaned_data["limit"],
                wildcard="?" if form.cleaned_data["wildcard"] else None,
            )

        return render(self.request, self.template_name, self.get_context_data(words=words))
