package services

import (
	"basjut/backend/models"
	"errors"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserService provides methods for interacting with users
type UserService struct {
	db *gorm.DB
}

// NewUserService creates a new user service
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		db: db,
	}
}

// GetAllUsers returns all users
func (s *UserService) GetAllUsers() ([]models.User, error) {
	var users []models.User
	if err := s.db.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// GetUserByID returns a user by ID
func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail returns a user by email
func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// CreateUser creates a new user
func (s *UserService) CreateUser(input models.CreateUserInput) (*models.User, error) {
	// Check if user already exists
	var count int64
	s.db.Model(&models.User{}).Where("email = ?", input.Email).Count(&count)
	if count > 0 {
		return nil, errors.New("email already in use")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// UpdateUser updates a user
func (s *UserService) UpdateUser(id uint, input models.UpdateUserInput) (*models.User, error) {
	// Get user
	user, err := s.GetUserByID(id)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	updates := make(map[string]interface{})
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Email != "" {
		// Check if email is already in use by someone else
		var count int64
		s.db.Model(&models.User{}).Where("email = ? AND id != ?", input.Email, id).Count(&count)
		if count > 0 {
			return nil, errors.New("email already in use")
		}
		updates["email"] = input.Email
	}
	if input.Password != "" {
		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		updates["password"] = string(hashedPassword)
	}

	// Update user
	if err := s.db.Model(user).Updates(updates).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// DeleteUser deletes a user
func (s *UserService) DeleteUser(id uint) error {
	// Check if user exists
	if _, err := s.GetUserByID(id); err != nil {
		return err
	}

	// Delete user
	if err := s.db.Delete(&models.User{}, id).Error; err != nil {
		return err
	}

	return nil
}
