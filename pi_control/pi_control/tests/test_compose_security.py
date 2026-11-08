from pathlib import Path
from unittest import TestCase
import yaml


class DockerComposeSecurityTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.repo_root = Path(__file__).resolve().parent.parent.parent.parent
        cls.dev_compose_path = cls.repo_root / "docker-compose.yml"
        cls.prod_compose_path = cls.repo_root / "docker-compose.prod.yml"
        cls.example_env_path = cls.repo_root / "example.env"

    def test_no_postgres_trust_auth_in_compose_files(self):
        for compose_path in [self.dev_compose_path, self.prod_compose_path]:
            content = compose_path.read_text()
            self.assertNotIn("POSTGRES_HOST_AUTH_METHOD=trust", content)
            self.assertNotIn("trust", content.lower().split())

    def test_no_default_rabbitmq_guest_credentials_in_compose_files(self):
        for compose_path in [self.dev_compose_path, self.prod_compose_path]:
            content = compose_path.read_text()
            self.assertNotIn("amqp://guest:guest@", content)

    def test_postgres_password_configured(self):
        for compose_path in [self.dev_compose_path, self.prod_compose_path]:
            content = compose_path.read_text()
            self.assertIn("POSTGRES_PASSWORD=${DB_PASSWORD}", content)

    def test_rabbitmq_credentials_configured(self):
        for compose_path in [self.dev_compose_path, self.prod_compose_path]:
            content = compose_path.read_text()
            self.assertIn("RABBITMQ_DEFAULT_USER=${RABBITMQ_USER:-pi_control}", content)
            self.assertIn("RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASSWORD}", content)

    def test_pgbackups_password_configured_in_prod(self):
        content = self.prod_compose_path.read_text()
        parsed = yaml.safe_load(content)
        pgbackups_env = parsed["services"]["pgbackups"]["environment"]
        self.assertTrue(any("POSTGRES_PASSWORD" in item for item in pgbackups_env))

    def test_example_env_contains_required_variables(self):
        content = self.example_env_path.read_text()
        self.assertIn("DB_PASSWORD=", content)
        self.assertIn("RABBITMQ_USER=", content)
        self.assertIn("RABBITMQ_PASSWORD=", content)


class DockerignoreSecurityTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.repo_root = Path(__file__).resolve().parent.parent.parent.parent
        cls.dockerignore_path = cls.repo_root / ".dockerignore"

    def test_dockerignore_file_exists(self):
        self.assertTrue(self.dockerignore_path.exists())

    def test_dockerignore_excludes_sqlite3_databases(self):
        lines = [line.strip() for line in self.dockerignore_path.read_text().splitlines() if line.strip()]
        self.assertIn("*.sqlite3", lines)
        self.assertIn("**/*.sqlite3", lines)
        self.assertIn("**/db.sqlite3", lines)
        self.assertIn("db.sqlite3", lines)
