import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "Auth" + ".";

// Generic types for Auth concept
type User = ID;
type Username = string;
type Email = string;
type Password = string;

/**
 * User authentication concept
 * Manages user accounts with username, email, and password
 */
interface UserDocument {
  _id: User;
  username: Username;
  email: Email;
  password: Password; // In production, this should be hashed
  createdAt: number; // Unix timestamp
}

export default class AuthConcept {
  users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    // Create unique index on email
    this.users.createIndex({ email: 1 }, { unique: true });
    this.users.createIndex({ username: 1 }, { unique: true });
  }

  /**
   * registerUser (username: Username, email: Email, password: Password): (userId: User)
   *
   * **requires**
   *     email is not already registered;
   *     username is not already taken;
   *
   * **effect**
   *     create a new user with the given username, email, and password;
   *     return the newly created user's ID;
   */
  async registerUser({
    username,
    email,
    password,
  }: {
    username: Username;
    email: Email;
    password: Password;
  }): Promise<{ userId: User; username: Username } | { error: string }> {
    // Check if email already exists
    const existingEmail = await this.users.findOne({ email });
    if (existingEmail) {
      return { error: "Email is already registered" };
    }

    // Check if username already exists
    const existingUsername = await this.users.findOne({ username });
    if (existingUsername) {
      return { error: "Username is already taken" };
    }

    const userId: User = freshID();
    const newUser: UserDocument = {
      _id: userId,
      username,
      email,
      password, // TODO: In production, hash the password before storing
      createdAt: Date.now(),
    };

    try {
      await this.users.insertOne(newUser);
      return { userId, username };
    } catch (e) {
      if (e instanceof Error) {
        return { error: `Failed to register user: ${e.message}` };
      }
      return { error: "An unknown error occurred during registration." };
    }
  }

  /**
   * authenticateUser (email: Email, password: Password): (userId: User, username: Username)
   *
   * **requires**
   *     user with this email exists;
   *     password matches the stored password;
   *
   * **effect**
   *     return the user's ID and username if authentication succeeds;
   */
  async authenticateUser({
    email,
    password,
  }: {
    email: Email;
    password: Password;
  }): Promise<{ userId: User; username: Username } | { error: string }> {
    const user = await this.users.findOne({ email });

    if (!user) {
      return { error: "Invalid email or password" };
    }

    // TODO: In production, compare hashed passwords
    if (user.password !== password) {
      return { error: "Invalid email or password" };
    }

    return { userId: user._id, username: user.username };
  }

  /**
   * getUserById (userId: User): (user: UserDocument)
   *
   * **requires**
   *     user with this userId exists;
   *
   * **effect**
   *     return the user document (without password);
   */
  async getUserById({
    userId,
  }: {
    userId: User;
  }): Promise<
    { userId: User; username: Username; email: Email } | { error: string }
  > {
    const user = await this.users.findOne({ _id: userId });

    if (!user) {
      return { error: `User with ID ${userId} not found` };
    }

    return {
      userId: user._id,
      username: user.username,
      email: user.email,
    };
  }

  /**
   * getUserByUsername (username: Username): (user: UserDocument)
   *
   * **requires**
   *     user with this username exists;
   *
   * **effect**
   *     return the user document (without password);
   */
  async getUserByUsername({
    username,
  }: {
    username: Username;
  }): Promise<
    { userId: User; username: Username; email: Email } | { error: string }
  > {
    const user = await this.users.findOne({ username });

    if (!user) {
      return { error: `User with username ${username} not found` };
    }

    return {
      userId: user._id,
      username: user.username,
      email: user.email,
    };
  }

  /**
   * updatePassword (userId: User, oldPassword: Password, newPassword: Password)
   *
   * **requires**
   *     user with this userId exists;
   *     oldPassword matches the current password;
   *
   * **effect**
   *     update the user's password to newPassword;
   */
  async updatePassword({
    userId,
    oldPassword,
    newPassword,
  }: {
    userId: User;
    oldPassword: Password;
    newPassword: Password;
  }): Promise<Empty | { error: string }> {
    const user = await this.users.findOne({ _id: userId });

    if (!user) {
      return { error: `User with ID ${userId} not found` };
    }

    // TODO: In production, compare hashed passwords
    if (user.password !== oldPassword) {
      return { error: "Current password is incorrect" };
    }

    try {
      await this.users.updateOne(
        { _id: userId },
        { $set: { password: newPassword } }, // TODO: Hash in production
      );
      return {};
    } catch (e) {
      if (e instanceof Error) {
        return { error: `Failed to update password: ${e.message}` };
      }
      return { error: "An unknown error occurred while updating password." };
    }
  }

  /**
   * deleteUser (userId: User)
   *
   * **requires**
   *     user with this userId exists;
   *
   * **effect**
   *     delete the user from the system;
   */
  async deleteUser({
    userId,
  }: {
    userId: User;
  }): Promise<Empty | { error: string }> {
    const result = await this.users.deleteOne({ _id: userId });

    if (result.deletedCount === 0) {
      return { error: `User with ID ${userId} not found` };
    }

    return {};
  }
}
