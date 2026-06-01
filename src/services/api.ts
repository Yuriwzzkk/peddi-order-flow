import { supabase } from "@/lib/supabase";
import type { Order, MenuItem, Customer, Conversation, OwnerFlow, Restaurant, DashboardStats, Attendant, FlowTemplate } from "@/types";
import type { N8nWebhook } from "@/services/n8n";

export const api = {
  auth: {
    supabase,
    signIn: (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    getProfile: (userId: string) =>
      supabase.from("profiles").select("*").eq("id", userId).single().then(r => r.data),
  },

  orders: {
    list: (restaurantId: string) =>
      import("./orders").then(m => m.listOrders(restaurantId)),
    get: (orderId: string) =>
      import("./orders").then(m => m.getOrder(orderId)),
    createWithItems: (restaurantId: string, customerId: string, data: any) =>
      import("./orders").then(m => m.createOrderWithItems(restaurantId, customerId, data)),
    updateStatus: (orderId: string, status: string, restaurantId?: string) =>
      import("./orders").then(m => m.updateOrderStatusRPC(orderId, status, restaurantId)),
    assignDelivery: (orderId: string, personId: string, restaurantId?: string) =>
      import("./orders").then(m => m.assignDeliveryRPC(orderId, personId, restaurantId)),
    completeDelivery: (orderId: string, restaurantId?: string) =>
      import("./orders").then(m => m.completeDeliveryRPC(orderId, restaurantId)),
    subscribe: (restaurantId: string, cb: (o: Order, e: "INSERT" | "UPDATE" | "DELETE") => void) =>
      import("./orders").then(m => m.subscribeOrders(restaurantId, cb)),
    getMenuWithCategories: (restaurantId: string) =>
      import("./orders").then(m => m.getMenuWithCategories(restaurantId)),
    getConversationsWithLastMessage: (restaurantId: string) =>
      import("./orders").then(m => m.getConversationsWithLastMessage(restaurantId)),
  },

  menu: {
    listCategories: (restaurantId: string) =>
      import("./menu").then(m => m.listCategories(restaurantId)),
    createCategory: (restaurantId: string, name: string, emoji?: string) =>
      import("./menu").then(m => m.createCategory(restaurantId, name, emoji)),
    listItems: (restaurantId: string) =>
      import("./menu").then(m => m.listMenuItems(restaurantId)),
    createItem: (restaurantId: string, data: any) =>
      import("./menu").then(m => m.createMenuItem(restaurantId, data)),
    updateItem: (itemId: string, data: any) =>
      import("./menu").then(m => m.updateMenuItem(itemId, data)),
    deleteItem: (itemId: string) =>
      import("./menu").then(m => m.deleteMenuItem(itemId)),
    uploadImage: (restaurantId: string, file: File, itemId?: string) =>
      import("./upload").then(m => m.uploadMenuImage(restaurantId, file, itemId)),
  },

  customers: {
    list: (restaurantId: string) =>
      import("./customers").then(m => m.listCustomers(restaurantId)),
    get: (customerId: string) =>
      import("./customers").then(m => m.getCustomer(customerId)),
  },

  conversations: {
    list: (restaurantId: string) =>
      import("./conversations").then(m => m.listConversations(restaurantId)),
    get: (conversationId: string) =>
      import("./conversations").then(m => m.getConversation(conversationId)),
    sendMessage: (convId: string, sender: string, text: string) =>
      import("./conversations").then(m => m.sendMessage(convId, sender as any, text)),
    toggleMode: (convId: string, mode: "bot" | "attendant") =>
      import("./conversations").then(m => m.toggleConversationMode(convId, mode)),
  },

  team: {
    list: (restaurantId: string) =>
      import("./team").then(m => m.listAttendants(restaurantId)),
    create: (data: any) =>
      import("./team").then(m => m.createAttendant(data)),
    update: (profileId: string, data: any) =>
      import("./team").then(m => m.updateAttendant(profileId, data)),
    delete: (profileId: string) =>
      import("./team").then(m => m.deleteAttendant(profileId)),
  },

  dashboard: {
    stats: (restaurantId: string) =>
      import("./dashboard").then(m => m.getDashboardStats(restaurantId)),
  },

  analytics: {
    orderReport: (restaurantId: string, period?: string) =>
      import("./analytics").then(m => m.getOrderReport(restaurantId, period)),
    customerAnalytics: (restaurantId: string) =>
      import("./analytics").then(m => m.getCustomerAnalytics(restaurantId)),
    menuPerformance: (restaurantId: string) =>
      import("./analytics").then(m => m.getMenuPerformance(restaurantId)),
    deliveryPerformance: (restaurantId: string) =>
      import("./analytics").then(m => m.getDeliveryPerformance(restaurantId)),
    financialReport: (restaurantId: string, days?: number) =>
      import("./analytics").then(m => m.getFinancialReport(restaurantId, days)),
  },

  reports: {
    orderSummary: (restaurantId: string) =>
      import("./reports").then(m => m.getOrderSummary(restaurantId)),
    dailyRevenue: (restaurantId: string) =>
      import("./reports").then(m => m.getDailyRevenue(restaurantId)),
    topItems: (restaurantId: string) =>
      import("./reports").then(m => m.getTopItems(restaurantId)),
    attendantPerformance: (restaurantId: string) =>
      import("./reports").then(m => m.getAttendantPerformance(restaurantId)),
  },

  automations: {
    listFlows: (restaurantId: string) =>
      import("./automations").then(m => m.listFlows(restaurantId)),
    toggleFlow: (flowId: string, active: boolean) =>
      import("./automations").then(m => m.toggleFlow(flowId, active)),
    createFlow: (restaurantId: string, data: any) =>
      import("./automations").then(m => m.createFlow(restaurantId, data)),
    duplicateFlow: (flowId: string, restaurantId: string) =>
      import("./automations").then(m => m.duplicateFlow(flowId, restaurantId)),
    copyTemplate: (template: FlowTemplate, restaurantId: string) =>
      import("./automations").then(m => m.copyFlowTemplate(template, restaurantId)),
    setTriggerEvent: (flowId: string, event: string | null) =>
      import("./automations").then(m => m.setFlowTriggerEvent(flowId, event)),
  },

  flowEngine: {
    startFlow: (flowId: string, conversationId: string, variables?: any) =>
      import("./flow-engine").then(m => m.startFlow(flowId, conversationId, variables)),
    processInput: (conversationId: string, input: string) =>
      import("./flow-engine").then(m => m.processFlowInput(conversationId, input)),
    getFlowState: (conversationId: string) =>
      import("./flow-engine").then(m => m.getConversationFlowState(conversationId)),
    getTemplates: () =>
      import("./flow-engine").then(m => m.getFlowTemplates()),
    getBlocks: (flowId: string) =>
      import("./flow-engine").then(m => m.getFlowBlocks(flowId)),
    createBlock: (flowId: string, block: any) =>
      import("./flow-engine").then(m => m.createFlowBlock(flowId, block)),
    updateBlock: (blockId: string, updates: any) =>
      import("./flow-engine").then(m => m.updateFlowBlock(blockId, updates)),
    deleteBlock: (blockId: string) =>
      import("./flow-engine").then(m => m.deleteFlowBlock(blockId)),
    saveConnections: (flowId: string, connections: any[]) =>
      import("./flow-engine").then(m => m.saveFlowConnections(flowId, connections)),
    setConversationMode: (convId: string, mode: "bot" | "manual" | "flow") =>
      import("./flow-engine").then(m => m.setConversationMode(convId, mode)),
  },

  whatsapp: {
    sendMessage: (restaurantId: string, phone: string, message: string) =>
      import("./whatsapp").then(m => m.sendWhatsAppMessage(restaurantId, phone, message)),
    getConfig: (restaurantId: string) =>
      import("./whatsapp").then(m => m.getZApiConfig(restaurantId)),
    saveConfig: (restaurantId: string, token: string, instanceId: string, secret?: string) =>
      import("./whatsapp").then(m => m.saveZApiConfig(restaurantId, token, instanceId, secret)),
    getWebhookUrl: (restaurantId?: string) =>
      import("./whatsapp").then(m => m.getWebhookUrl(restaurantId)),
  },

  n8n: {
    listWebhooks: (restaurantId: string) =>
      import("./n8n").then(m => m.listN8nWebhooks(restaurantId)),
    createWebhook: (restaurantId: string, event: string, url: string, headers?: any) =>
      import("./n8n").then(m => m.createN8nWebhook(restaurantId, event, url, headers)),
    toggleWebhook: (id: string, active: boolean) =>
      import("./n8n").then(m => m.toggleN8nWebhook(id, active)),
    deleteWebhook: (id: string) =>
      import("./n8n").then(m => m.deleteN8nWebhook(id)),
    triggerEvent: (restaurantId: string, event: string, payload?: any) =>
      import("./n8n").then(m => m.triggerN8nEvent(restaurantId, event, payload)),
    processQueue: (restaurantId?: string) =>
      import("./n8n").then(m => m.processAutomationQueue(restaurantId)),
    dispatchDirect: (restaurantId: string, event: string, payload?: any) =>
      import("./n8n-dispatch").then(m => m.dispatchToWebhooks(restaurantId, event, payload)),
    dispatchQueue: (restaurantId?: string, limit?: number) =>
      import("./n8n-dispatch").then(m => m.dispatchPendingAutomationQueue(restaurantId, limit)),
  },

  notifications: {
    listPending: (restaurantId?: string) =>
      import("./notifications").then(m => m.listPendingNotifications(restaurantId)),
    send: (restaurantId: string, phone: string, message: string, opts?: any) =>
      import("./notifications").then(m => m.sendNotification(restaurantId, phone, message, opts)),
    markSent: (id: string, sentAt?: string) =>
      import("./notifications").then(m => m.markNotificationSent(id, sentAt)),
    markFailed: (id: string, error: string) =>
      import("./notifications").then(m => m.markNotificationFailed(id, error)),
    processPending: (limit?: number) =>
      import("./notifications").then(m => m.processPendingNotifications(limit)),
  },

  master: {
    restaurantsSummary: () =>
      import("./master").then(m => m.getAllRestaurantsSummary()),
    platformRevenue: (days?: number) =>
      import("./master").then(m => m.getPlatformRevenue(days)),
    restaurantDetail: (id: string) =>
      import("./master").then(m => m.getRestaurantDetail(id)),
    updatePlan: (id: string, plan: string) =>
      import("./master").then(m => m.updateRestaurantPlan(id, plan)),
    toggleRestaurant: (id: string, active: boolean) =>
      import("./master").then(m => m.toggleRestaurantActive(id, active)),
    listPeddiTeam: () =>
      import("./master").then(m => m.listPeddiTeam()),
    addPeddiMember: (data: any) =>
      import("./master").then(m => m.addPeddiTeamMember(data)),
    removePeddiMember: (id: string) =>
      import("./master").then(m => m.removePeddiTeamMember(id)),
    globalStats: () =>
      import("./master").then(m => m.getGlobalStats()),
  },

  admin: {
    createUser: (data: any) =>
      import("./auth").then(m => m.adminCreateUser(data.email, data.password, data.name, data.role, data.restaurantId, data.type, data.shift)),
    getUsers: (restaurantId: string) =>
      import("./auth").then(m => m.getUsersByRestaurant(restaurantId)),
  },

  restaurant: {
    get: (restaurantId: string) =>
      supabase.from("restaurants").select("*").eq("id", restaurantId).single().then(r => r.data),
    update: (restaurantId: string, data: any) =>
      supabase.from("restaurants").update(data).eq("id", restaurantId).then(r => r.data),
    uploadLogo: (restaurantId: string, file: File) =>
      import("./upload").then(m => m.uploadLogo(restaurantId, file)),
  },

  storage: {
    uploadMenuImage: (restaurantId: string, file: File, itemId?: string) =>
      import("./upload").then(m => m.uploadMenuImage(restaurantId, file, itemId)),
    deleteMenuImage: (path: string) =>
      import("./upload").then(m => m.deleteMenuImage(path)),
  },
};

export default api;
