package routes

import (
	"basjut/backend/controllers"
	"basjut/backend/middlewares"

	"github.com/gin-gonic/gin"
)

// SetupUserRoutes configures the user-related routes
func SetupUserRoutes(router *gin.Engine, userController *controllers.UserController) {
	// Public routes
	public := router.Group("/api/v1")
	{
		// Health check
		public.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status": "ok",
			})
		})
	}

	// Protected routes
	protected := router.Group("/api/v1")
	protected.Use(middlewares.AuthMiddleware())
	{
		users := protected.Group("/users")
		{
			users.GET("", userController.GetUsers)
			users.GET("/:id", userController.GetUser)
			users.POST("", userController.CreateUser)
			users.PUT("/:id", userController.UpdateUser)
			users.DELETE("/:id", userController.DeleteUser)
		}
	}
}
