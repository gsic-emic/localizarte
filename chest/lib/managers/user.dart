import '../helpers/user.dart' as user;

class User {
  static user.User logInUser() {
    return user.User.witoutTasks("pablo", 1);
  }
}
