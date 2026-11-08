from django import forms


class BuildEbookForm(forms.Form):
    url = forms.URLField(label="Adresa", required=True, assume_scheme="https")
    kindle_email = forms.EmailField(label="Adresa čítačky", required=True)
