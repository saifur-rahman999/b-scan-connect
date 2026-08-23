import type {Metadata} from "next";
import {requireChatGPTUser} from "../../../chatgpt-auth";
import {requireCatalogActor} from "../../../../db/catalog-repository";
import {listAdminUsers} from "../../../../db/admin-repository";
import {AdminNav} from "../admin-nav";
import {UserManager} from "./user-manager";
export const dynamic="force-dynamic";export const metadata:Metadata={title:"User administration",description:"Manage B-SCAN Connect workspace access."};
export default async function UsersPage(){await requireChatGPTUser("/workspace/admin/users");const users=await listAdminUsers(await requireCatalogActor());return <div className="member-page"><AdminNav active="users"/><main id="main-content" className="shell member-main"><div className="member-title"><p className="workspace-kicker">Access management</p><h1>Users</h1><p>Add people, assign workspace roles and control account access.</p></div><UserManager initialUsers={users}/></main></div>}
