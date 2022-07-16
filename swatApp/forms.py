from django.forms import ModelForm
from .model import accessCode

class accessCodeForm(ModelForm):
    class Meta:
        model = accessCode
        fields = ('access_code',)
