import type {Metadata} from "next";
import {requireChatGPTUser} from "../../../chatgpt-auth";
import {listManagedCatalog,requireCatalogActor} from "../../../../db/catalog-repository";
import {AdminNav} from "../admin-nav";
import {ApprovalManager} from "./approval-manager";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Approval queue",description:"Review submitted catalogue listings."};
export default async function ApprovalPage(){await requireChatGPTUser("/workspace/admin/approvals");const listings=(await listManagedCatalog(await requireCatalogActor(),"admin")).filter(item=>item.status==="SUBMITTED");return <div className="member-page"><AdminNav active="approvals"/><main id="main-content" className="shell member-main"><div className="member-title"><p className="workspace-kicker">Content review</p><h1>Approval queue</h1><p>Publish submitted catalogue records or return them with a clear change request.</p></div><ApprovalManager initialListings={listings}/></main></div>}
