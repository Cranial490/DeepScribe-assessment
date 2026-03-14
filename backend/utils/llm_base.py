from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class LLMBase(ABC):
    @abstractmethod
    async def parse(
        self,
        model: str,
        schema: type[T],
        messages: list[dict[str, str]],
    ) -> T:
        """Return structured output parsed into the provided Pydantic schema."""
