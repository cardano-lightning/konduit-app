import { createWebHistory, createRouter } from "vue-router";

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
  { name: "wallet", path: "/wallet", component: WalletPage },
  { name: "pay", path: "/pay", component: PayPage },
  { name: "settings", path: "/settings", component: SettingsPage },
  { name: "create", path: "/create", component: CreatePage },
  {
    name: "add-channel",
    path: "/add-channel",
    component: AddChannel,
    meta: { title: "Add Channel" },
  },
];

const router = createRouter({
  history: createWebHistory(
    import.meta.env.BASE_URL || "http://localhost:5173/",
  ),
  routes,
});

export default router;
