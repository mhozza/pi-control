import json
import logging
import warnings
from rest_framework import exceptions
from rest_framework.authentication import TokenAuthentication, get_authorization_header

logger = logging.getLogger(__name__)


class SafeTokenAuthentication(TokenAuthentication):
    def authenticate(self, request):
        # 1. Standard Authorization header (Bearer or Token)
        auth = get_authorization_header(request).split()
        if auth and auth[0].lower() in (b"token", b"bearer"):
            if len(auth) == 1:
                raise exceptions.AuthenticationFailed("Invalid token header. No credentials provided.")
            elif len(auth) > 2:
                raise exceptions.AuthenticationFailed("Invalid token header. Token string should not contain spaces.")
            try:
                token = auth[1].decode()
            except UnicodeError:
                raise exceptions.AuthenticationFailed("Invalid token header. Token string contains invalid characters.")
            return self.authenticate_credentials(token)

        # 2. Request body (POST/PUT/PATCH JSON or form data)
        token = None
        if hasattr(request, "data") and isinstance(request.data, dict):
            token = request.data.get("token") or request.data.get("api_key")
        elif hasattr(request, "POST") and (request.POST.get("token") or request.POST.get("api_key")):
            token = request.POST.get("token") or request.POST.get("api_key")
        elif hasattr(request, "body") and request.body:
            try:
                content_type = getattr(request, "content_type", "") or ""
                if "json" in content_type:
                    data = json.loads(request.body)
                    if isinstance(data, dict):
                        token = data.get("token") or data.get("api_key")
            except Exception:
                pass

        if token and isinstance(token, str):
            key = token.strip()
            if key:
                return self.authenticate_credentials(key)

        # 3. Query string (deprecated fallback for backwards compatibility)
        params = getattr(request, "query_params", getattr(request, "GET", None))
        if params is not None:
            q_token = params.get("token") or params.get("api_key")
            if q_token and isinstance(q_token, str):
                key = q_token.strip()
                if key:
                    warnings.warn(
                        "Query string token authentication is deprecated. Use Authorization header or request body.",
                        DeprecationWarning,
                        stacklevel=2,
                    )
                    return self.authenticate_credentials(key)

        return None


# Backward compatibility alias
QueryStringBasedTokenAuthentication = SafeTokenAuthentication
