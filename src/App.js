import './App.css';
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import Home from './components/pages/Home';
import CustomerDetailPage from './components/pages/customer.js';
import CustomersListPage from './customerListPage.js';
import TodoListApp from './components/pages/todolistapp.js';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/customers' element={<Home/>}/>
          <Route path="/customers/:customerNo" element={<CustomerDetailPage />} />
          <Route path='/todolist' element={<TodoListApp/>}/>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
