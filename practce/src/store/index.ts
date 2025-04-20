import { configureStore } from "@reduxjs/toolkit"
import conversationReducer from "./slices/conversationReducer"

export const store = configureStore({
    reducer: {
        conversation: conversationReducer,
    },
  })