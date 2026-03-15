import asyncio

import httpx


class ClinicalClient:
    def __init__(
        self,
        base_url: str = "https://clinicaltrials.gov/api/v2/studies",
        default_fields: tuple[str, ...] = (
            "NCTId",
            "BriefTitle",
            "BriefSummary",
        ),
    ) -> None:
        self.base_url = base_url
        self.default_fields = default_fields

    async def search_studies(
        self,
        diagnosis: str,
        *,
        query_term: str | None = None,
        location_text: str | None = None,
        overall_status_filter: str = "RECRUITING|NOT_YET_RECRUITING|ACTIVE_NOT_RECRUITING",
        fields: tuple[str, ...] | None = None,
        sort: str = "@relevance",
        page_size: int = 10,
        page_token: str | None = None,
        timeout_seconds: float = 20.0,
        total_count: bool = True,
        client: httpx.AsyncClient | None = None,
    ) -> dict:
        """Search studies from ClinicalTrials.gov v2.

        API mapping:
        - `query.cond` <- `diagnosis`
        - `query.term` <- `query_term`
        - `query.locn` <- `location_text`
        - `filter.overallStatus` <- `overall_status_filter`
        - `fields` <- `fields` (or `self.default_fields`)
        - `sort` <- `sort`
        - `pageSize` <- `page_size`
        - `pageToken` <- `page_token`
        - `countTotal` <- `total_count`
        """
        diagnosis = diagnosis.strip()
        if not diagnosis:
            raise ValueError("diagnosis must be a non-empty string.")

        page_size = max(1, min(page_size, 100))
        selected_fields = fields or self.default_fields

        params: dict[str, str | int] = {
            "format": "json",
            "query.cond": diagnosis,
            "filter.overallStatus": overall_status_filter,
            "fields": ",".join(selected_fields),
            "sort": sort,
            "pageSize": page_size,
            "countTotal": str(total_count).lower(),
        }
        if query_term:
            params["query.term"] = query_term.strip()
        if location_text:
            params["query.locn"] = location_text.strip()
        if page_token:
            params["pageToken"] = page_token

        managed_client = client or httpx.AsyncClient()
        try:
            print(params)
            response = await managed_client.get(
                self.base_url,
                params=params,
                headers={"accept": "application/json"},
                timeout=timeout_seconds,
            )
            response.raise_for_status()
            return response.json()
        finally:
            if client is None:
                await managed_client.aclose()

