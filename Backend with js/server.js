const express = require('express');
const app = express();

const PORT = 3000;

app.use(express.json());


const users = [];


const items = [
  {
    id: 'item_1',
    name: 'Vintage Watch',
    price: 150,
    sellerId: 'admin',
    isSold: false
  },
  {
    id: 'item_2',
    name: 'Wireless Headphones',
    price: 80,
    sellerId: 'admin',
    isSold: false
  },
];


const dummyAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required: missing x-user-id header' });
  }
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'Authentication failed: user not found' });
  }
  req.user = user;
  next();
};


app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username must be unique' });
  }
  const newUser = {
    id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    username,
    password,
    balance: 0
  };
  users.push(newUser);
  return res.status(201).json({
    user: {
      id: newUser.id,
      username: newUser.username,
      balance: newUser.balance
    }
  });
});


app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const user = users.find(
    u => u.username === username && String(u.password) === String(password)
  );
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  return res.status(200).json({
    userId: user.id
  });
});


app.post('/api/deposit', dummyAuth, (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0 || isNaN(amount)) {
    return res.status(400).json({ error: 'Amount must be a number greater than 0' });
  }
  req.user.balance += amount;
  return res.status(200).json({
    newBalance: req.user.balance
  });
});


app.get('/api/items', (req, res) => {
  const availableItems = items.filter(item => !item.isSold);
  return res.status(200).json({
    items: availableItems
  });
});


app.post('/api/items/sell', dummyAuth, (req, res) => {
  const { name, price } = req.body;
  if (!name || typeof name !== 'string' || typeof price !== 'number' || price <= 0 || isNaN(price)) {
    return res.status(400).json({ error: 'Valid name and a positive price are required' });
  }
  const newItem = {
    id: `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    price,
    sellerId: req.user.id,
    isSold: false
  };
  items.push(newItem);
  return res.status(201).json({
    item: newItem
  });
});


app.post('/api/items/buy/:id', dummyAuth, (req, res) => {
  const itemId = req.params.id;
  const item = items.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  if (item.isSold) {
    return res.status(400).json({ error: 'Item is already sold' });
  }
  if (item.sellerId === req.user.id) {
    return res.status(400).json({ error: 'Cannot buy your own item' });
  }
  if (req.user.balance < item.price) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  req.user.balance -= item.price;
  const seller = users.find(u => u.id === item.sellerId);
  if (seller) {
    seller.balance += item.price;
  }
  item.isSold = true;
  return res.status(200).json({
    remainingBalance: req.user.balance,
    item
  });
});


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

