import os
import unittest
from unittest import mock

from persistence.bootstrap import get_required_database_url


class BootstrapTests(unittest.TestCase):
    def test_get_required_database_url_raises_when_missing(self) -> None:
        with mock.patch.dict(os.environ, {}, clear=True), mock.patch(
            "persistence.bootstrap.load_dotenv"
        ):
            with self.assertRaises(RuntimeError):
                get_required_database_url()

    def test_get_required_database_url_returns_value_when_present(self) -> None:
        value = "postgresql://demo:demo@localhost:5432/demo"
        with mock.patch.dict(os.environ, {"DATABASE_URL": value}, clear=True), mock.patch(
            "persistence.bootstrap.load_dotenv"
        ):
            self.assertEqual(get_required_database_url(), value)


if __name__ == "__main__":
    unittest.main()
