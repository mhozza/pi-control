from django.contrib.messages import SUCCESS, add_message
from django.urls import reverse_lazy
from django.views.generic.edit import FormView

from .forms import BuildEbookForm
from .tasks import convert_ebook


class BuildEbookView(FormView):
    template_name = "ff_ebook_frontend/build_ebook.html"
    form_class = BuildEbookForm
    success_url = reverse_lazy("build-ebook")

    def get_initial(self):
        return {"sender_email": self.request.user.email}

    def form_valid(self, form):
        url = form.cleaned_data["url"]
        result = convert_ebook.delay(
            url, form.cleaned_data["sender_email"], form.cleaned_data["kindle_email"]
        )
        add_message(self.request, SUCCESS, "Vyrábam knihu pre Kindle z {}.".format(url))
        return super().form_valid(form)
