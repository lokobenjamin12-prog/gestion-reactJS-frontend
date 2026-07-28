import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './app/providers/QueryProvider';
import { AuthBootstrap } from './app/providers/AuthBootstrap';
import { router } from './app/router';
import { ToastContainer } from '@/shared/ui/Toast';


function App() {
  return (
    <QueryProvider>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
      <ToastContainer />
    </QueryProvider>
  );
}
   

export default App;
