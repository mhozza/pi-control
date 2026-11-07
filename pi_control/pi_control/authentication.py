from rest_framework.authentication import TokenAuthentication


class QueryStringBasedTokenAuthentication(TokenAuthentication):
    def authenticate(self, request):
        params = getattr(request, "query_params", getattr(request, "GET", None))
        if params is None:
            return None
        token = params.get("token")
        if not token:
            return None
        key = token.strip()
        if key:
            return self.authenticate_credentials(key)
        return None
