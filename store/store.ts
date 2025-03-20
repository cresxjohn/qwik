import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import transactionsReducer from "./slices/transactionsSlice";
import paymentsReducer from "./slices/paymentsSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["transactions", "payments"], // Only persist these reducers
};

const rootReducer = combineReducers({
  transactions: transactionsReducer,
  payments: paymentsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
