from django import forms


class BuildEbookForm(forms.Form):
    url = forms.URLField(label='Adresa', required=True, initial='http://')
    kindle_email = forms.EmailField(label='Adresa čítačky', required=True)
    sender_email = forms.EmailField(label='Adresa odosielateľa', required=True)
