import { createRouter, createWebHashHistory } from "vue-router";

import IndexPage from "./views/IndexPage.vue";
import WalletPage from "./views/WalletPage.vue";
import PayPage from "./views/PayPage.vue";
import SettingsPage from "./views/SettingsPage.vue";
import CreatePage from "./views/CreatePage.vue";
import AddChannel from "./views/AddChannel.vue";

const routes = [
  {
    name: "index",
    path: "/",
    component: IndexPage,
    meta: { title: "Konduit" },
  },
  {
    name: "wallet",
    path: "/wallet",
    component: WalletPage,
    meta: { title: "Wallet" },
  },
  { name: "pay", path: "/pay", component: PayPage, meta: { title: "Pay" } },
  {
    name: "settings",
    path: "/settings",
    component: SettingsPage,
    meta: { title: "Settings" },
  },
  {
    name: "create",
    path: "/create",
    component: CreatePage,
    meta: { title: "Create" },
  },
  {
    name: "add-channel",
    path: "/add-channel",
    component: AddChannel,
    meta: { title: "Add Channel" },
  },
];

const router = createRouter({
  history: createWebHashHistory(
    // @ts-ignore
    import.meta.env.BASE_URL || "http://localhost:5173/",
  ),
  routes,
});

export default router;
