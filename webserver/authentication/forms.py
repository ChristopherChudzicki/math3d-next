from django import forms


class CustomSignupForm(forms.Form):
    """
    Custom signup form that adds public_nickname to allauth's signup flow.

    allauth's headless mode uses this form to accept extra fields during signup.
    The field declared here appears in allauth's dynamic OpenAPI spec and is
    passed through to the adapter's save_user() via form.cleaned_data.
    """

    public_nickname = forms.CharField(max_length=64, required=False)

    def signup(self, request, user):
        """Called by allauth after user is saved. Nothing extra to do here
        since public_nickname is handled in the adapter's save_user()."""
        pass
