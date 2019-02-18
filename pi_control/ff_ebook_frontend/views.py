from django.views.generic.edit import FormView

from .forms import BuildEbookForm


class BuildEbookView(FormView):
    template_name = 'ff_ebook_frontend/build_ebook.html'
    form_class = BuildEbookForm

    def get_initial(self):
        return {
            'sender_email': self.request.user.email
        }

    def form_valid(self, form):
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        form.send_email()
        return super().form_valid(form)
