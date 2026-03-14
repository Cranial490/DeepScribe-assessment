from __future__ import annotations

from openai import AsyncOpenAI

from .llm_base import LLMBase, T


class Openai_llm(LLMBase):
    def __init__(self, llm_api_key: str) -> None:
        self.api_key = llm_api_key
        self.llm = AsyncOpenAI(api_key=self.api_key)

    async def parse(
        self,
        model: str,
        schema: type[T],
        messages: list[dict[str, str]],
    ) -> T:
        response = await self.llm.responses.parse(
            model=model,
            input=messages,
            text_format=schema,
        )
        parsed = response.output_parsed
        if parsed is None:
            raise ValueError("LLM returned no parsed content.")
        if not isinstance(parsed, schema):
            raise ValueError("LLM returned invalid parsed content type.")
        return parsed
