import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layout/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>

          {/* Default redirect to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<></>} />
          <Route path="rag" element={<></>} />
          <Route path="policies" element={<></>} />
          <Route path="knowledge-base" element={<></>} />


        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
