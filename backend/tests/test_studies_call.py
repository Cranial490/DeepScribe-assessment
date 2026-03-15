import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from utils.clinical_apis.studies import ClinicalClient


async def run_search_studies_smoke_test() -> None:
    client = ClinicalClient()
    result = await client.search_studies(
        diagnosis="lung cancer",
        page_size=2,
        timeout_seconds=30.0,
    )
    studies = result.get("studies", [])
    print(f"studies_returned={len(studies)}")
    if studies:
        first = studies[0]
        protocol = first.get("protocolSection", {})
        ident = protocol.get("identificationModule", {})
        print(f"first_nct_id={ident.get('nctId')}")
        print(f"first_title={ident.get('briefTitle')}")


if __name__ == "__main__":
    asyncio.run(run_search_studies_smoke_test())
