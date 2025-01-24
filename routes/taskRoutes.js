const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require('../middlewares/authMiddleware');
const taskController = require("../controllers/taskController");


// project route
router.post('/add-project', taskController.addProject);
router.put('/update-project/:id', taskController.updateProjectById);
router.get('/get-projects', authMiddleware, taskController.getProjects);

// task routes
router.post('/add-task', taskController.addTask);
router.put('/update-task/:id', taskController.updateTaskById);
router.get('/get-tasks', authMiddleware, taskController.getTasks);
router.get('/get-tasks/:project_id', authMiddleware, taskController.getTasksByProjectId);
router.get('/get-task-details/:id', authMiddleware, taskController.getTasksById);


module.exports = router;