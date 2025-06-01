import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import folktaleRoutes from './routes/folktales.js';
import adminRoutes from './routes/admin.js';
import path from "path";

dotenv.config();
connectDB();

const __dirname = path.resolve();
const corsOptions = {
    orogin : 'http://localhost:5173',
    credentials: true
}

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/folktales', folktaleRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname,"/frontend/dist")));
app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,"frontend","dist","index.html"));
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));