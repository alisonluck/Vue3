var sanitize = require("mongo-sanitize");
var crypto = require("crypto");
var uuidV1 = require("uuid/v1");
var fs = require("fs");
var path = require("path");
var localFileDir = `${__dirname}/../../public/uploads`;
const normolizePath = path.normalize(localFileDir);
var User = require("../../models/user");
var mailer = require("../../controllers/mailer");
var auth = require("../../functions/authenticate");
var jimp = require("jimp");

exports.login = function (req, res) {
    try {
        var error = [];
        var email = req.body.email;
        var password = req.body.password;

        if (!email || email.trim() == "") {
            error.push("Email is required.");
        }
        if (!password || password.trim() == "") {
            error.push("Password is required.");
        }

        if (error.length > 0) {
            throw error;
        }

        email = email.toLowerCase();

        console.log("email:", email);

        console.log("pwd", password);

        User.findOne({email: sanitize(email.trim()), type: "user", status: true})
                .then(user => {
                    if (!user) {
                        throw new Error("Invalid login");
                    }
                    if (!user.validPassword(sanitize(password.trim()))) {
                        throw new Error("Invalid login");
                    }
                    var payloadData = {
                        id: user._id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        image: user.image
                    };
                    console.log(payloadData, 'payloadData')
                    auth.generateJwtToken(payloadData, function (tokenError, token) {
                        if (tokenError) {
                            throw tokenError;
                        }
                        return res.json({
                            success: true,
                            token: token,
                            detail: payloadData
                        });
                    });
                })
                .catch(err => {
                    console.log("\n\nErr - then Catch() >>>>>>", err, "\n\n");
                    return res.json({
                        success: false,
                        error: err.message || err
                    });
                });
    } catch (Err) {
        return res.json({
            success: false,
            error: Err.message || Err
        });
    }
};

exports.updateProfileImage = function (req, res) {
    try {
        var error = [];

        var _id = req.body.id || req.params.id;
        // var image = req.body.img;
        var image = req.file

        // console.log(_id);

        if (_id == '' || _id === undefined || _id === null) {
            error.push("Invalid Request");
        }

        if (error.length > 0) {
            throw error;
        } else {
            User.find({_id: _id,  status: true})
                    .then(results => {
                        if (results.length > 0) {
                            if (image != undefined || image != null) {
                                var generateNewName = uuidV1();
                                var fileExt = path.extname(image.originalname);
                                newFileName = generateNewName + fileExt;
                                var newFile = "public/users_image/" + newFileName;
                                var thumbnailFile = "public/users_image/thumb/" + newFileName;
                                fs.renameSync(image.path, newFile);
                                jimp
                                .read(newFile)
                                .then(result => {
                                result
                                    .resize(150, jimp.AUTO) // resize
                                    .write(thumbnailFile); // save
                                    User.findByIdAndUpdate(results[0]._id, {image: newFileName}, {new : true}, function (err, results) {
                                        if (err) {
                                            throw err
                                        } else {
                                            return res.json({
                                                success: true,
                                                message: 'Image updated Successfully',
                                                data: results
                                            });
                                        }
                                    }).catch(err_update => {
                                        return res.json({
                                            success: false,
                                            error: 'Something went wrong during update user profile',
                                            data: err_update.message || err_update
                                        })
                                    })
                                })
                                .catch(jimp_error => {
                                    inner_callback(jimp_error, inner_callback);
                                    return res.json({
                                        success: false,
                                        message: 'error in thumbnail generation.',
                                        data: jimp_error.message || jimp_error
                                    });
                                });
                            } else {
                                return res.json({
                                    success: false,
                                    error: 'Please select a image'
                                })
                            }
                        } else {
                            return res.json({
                                success: false,
                                error: 'User not found'
                            })
                        }
                    }).catch(err => {
                        return res.json({
                            success: false,
                            error: 'error during find user',
                            data: err.message || err
                        })
            })
        }
    } catch (Err) {
        return res.json({
            success: false,
            error: Err.message || Err
        })
    }
}

exports.deleteProfileImage = function (req, res) {
    try {
        var error = [];
        var _id = req.body.id || req.params.id;
        var image = "";
        
        // var image = req.file;
        var todayDate = new Date();
        // var newFileName;

        if (_id == '' || _id === undefined || _id === null) {
            error.push("Invalid Request");
        }
        
        if (error.length > 0) {
            throw error;
        } else {
            User.find({_id: _id,  status: true})
                    .then(results => {
                        if (results.length > 0) {
                            // if (image !== undefined || image !== null) {
                            //   var generateNewName = uuidV1();
                            //   var fileExt = path.extname(image.originalname);
                            //   newFileName = generateNewName + fileExt;
                            //   var newFile = "public/users_image/" + newFileName;
                            //   fs.renameSync(image.path, newFile);
                            // }
                            var updateData = {
                                image: image,
                                updated_at: todayDate
                            }
                            User.findOneAndUpdate({_id: results[0]._id}, updateData, {new : true,useFindAndModify: false}, function (err, resultsData) {
                               if (err) {
                                    throw err
                                } else {
                                    var finalData = {
                                        image:resultsData.image,
                                        type:resultsData.type,
                                        status:resultsData.status,
                                        id:resultsData._id,
                                        first_name:resultsData.first_name,
                                        last_name:resultsData.last_name,
                                        email:resultsData.email,
                                        password:resultsData.password,
                                        createdAt:resultsData.createdAt,
                                        updatedAt:resultsData.updatedAt,
                                      };
                                      res.json({
                                        success: true,
                                        message: 'Profile updated Successfully',
                                        data: finalData
                                      });
                                }
                            })
                        } else {
                            res.json({
                                success: false,
                                message: 'User not found!',
                            });
                        }
                    }).catch(err => {
                throw err
            });
        }
    } catch (Err) {
        return res.json({
            success: false,
            error: Err.message || Err
        });
    }
}

exports.updateProfile = function (req, res) {
    try {
        var error = [];
        var _id = req.body.id || req.params.id;
        var fname = req.body.first_name;
        var lname = req.body.last_name;
        var email = req.body.email;
        
        email = email.toLowerCase();
        // var image = req.file;
        var todayDate = new Date();
        // var newFileName;

        if (_id == '' || _id === undefined || _id === null) {
            error.push("Invalid Request");
        }
        if (fname == '' || fname === undefined || fname === null) {
            error.push("First name is required.");
        }
        if (email == '' || email === undefined || email === null) {
            error.push("Email is required.");
        }
        if (error.length > 0) {
            throw error;
        } else {
            User.find({_id: _id,  status: true})
                    .then(results => {
                        if (results.length > 0) {
                            // if (image !== undefined || image !== null) {
                            //   var generateNewName = uuidV1();
                            //   var fileExt = path.extname(image.originalname);
                            //   newFileName = generateNewName + fileExt;
                            //   var newFile = "public/users_image/" + newFileName;
                            //   fs.renameSync(image.path, newFile);
                            // }
                            var updateData = {
                                first_name: fname,
                                last_name: lname,
                                email: email,
                                
                                updated_at: todayDate
                            }
                            User.findOneAndUpdate({_id: results[0]._id}, updateData, {new : true,useFindAndModify: false}, function (err, resultsData) {
                               if (err) {
                                    throw err
                                } else {
                                    var finalData = {
                                        image:resultsData.image,
                                        type:resultsData.type,
                                        status:resultsData.status,
                                        id:resultsData._id,
                                        first_name:resultsData.first_name,
                                        last_name:resultsData.last_name,
                                        email:resultsData.email,
                                        password:resultsData.password,
                                        createdAt:resultsData.createdAt,
                                        updatedAt:resultsData.updatedAt,
                                      };
                                      res.json({
                                        success: true,
                                        message: 'Profile updated Successfully',
                                        data: finalData
                                      });
                                }
                            })
                        } else {
                            res.json({
                                success: false,
                                message: 'User not found!',
                            });
                        }
                    }).catch(err => {
                throw err
            });
        }
    } catch (Err) {
        return res.json({
            success: false,
            error: Err.message || Err
        });
    }
}

exports.signup = function (req, res, next) {
    try {
        var error = [];

        var fname = req.body.first_name;
        var lname = req.body.last_name;
        var email = req.body.email;
        email = email.toLowerCase();
        var password = req.body.password;

        if (!fname || fname.trim() == "") {
            error.push("First name is required.");
        }
        if (!email || email.trim() == "") {
            error.push("Email is required.");
        }
        if (!password || password == "") {
            error.push("Password is required.");
        }


        if (error.length > 0) {
            throw error;
        }

        User.findOne({email: email})
                .then(result => {
                    console.log("\nUser Found: ", result);

                    if (result) {
                        if (result.email == email.trim()) {
                            throw "This email is already occupied. Please try again with different email.";
                        }
                    }
                    var user = new User();
                    user.first_name = fname.trim();
                    user.last_name = lname.trim();
                    user.email = email;
                    user.password = user.encryptPassword(password);
                    user.created_at = new Date();
                    user.updated_at = new Date();

                    user.save(function (err, result) {
                        if (err) {
                            throw err;
                        }
                        var payloadData = {
                            id: result._id,
                            username: result.username || '',
                            first_name: result.first_name || '',
                            last_name: result.last_name || '',
                            email: result.email,
                            image: result.image
                        };
                        auth.generateJwtToken(payloadData, function (tokenError, token) {
                            if (tokenError) {
                                throw tokenError;
                            }
                            return res.json({
                                success: true,
                                token: token,
                                detail: payloadData
                            });
                        });
                    });
                })
                .catch(err => {
                    return res.json({
                        success: false,
                        error: "duplicate"
                    });
                });
    } catch (Err) {
        return res.json({
            success: false,
            error: Err.message || Err
        });
    }
};

exports.forgotPassword = function (req, res) {
    try {
        var email = req.body.email;

        if (!email || email.trim() == "") {
            throw new Error("Email is required.");
        }

        email = email.toLowerCase();

        User.findOne({email: sanitize(email.trim()), type: "user", status: true})
                .then(result => {
                    if (!result) {
                        throw new Error("Invalid email or your account is blocked. Please contact with app support team.");
                    }
                    generateToken(function (tokenErr, token) {
                        try {
                            if (tokenErr) {
                                console.log("\n\nError: forgotPassword - generateToken: ", tokenErr, "\n\n");
                                throw new Error("There is something went wrong in token. Please try again.");
                            }
                            result.reset_token = token;

                            result.save(async function (saveErr, savedResult) {

                                if (saveErr) {
                                    console.log("\n\nError: forgotPassword - generateToken - save: ", saveErr, "\n\n");
                                    throw new Error("There is something went wrong in saving. Please try again.");
                                }
                                // var currentWebURL = req.protocol + "://" + req.get("host");
                                try {
                                    // Send Email
                                    var randomstring = Math.random().toString(36).slice(-8);
                                    console.log(randomstring);
                                    var subject = "Forgot Password";
                                    var to = savedResult.email;
                                    
                                    var html = `Hi, this is newly create password. Try this one - ${randomstring}`;
                                    await mailer.send(to, subject, html);





                                    User.findOne({ reset_token: sanitize(token) }, function(err, user) {
                                      try {
                                        if (err) {
                                          throw new Error("The page you are looking for might have been removed or had its name changed or is temporarily unavailable.");
                                        }

                                        var updateUser = new User();

                                        user.password = updateUser.encryptPassword(sanitize(randomstring));
                                        user.reset_token = "";
                                        user.save(function(saveErr, result) {
                                          if (saveErr) {
                                            return res.json({
                                                success: true,
                                                message: "user save is error."
                                            });
                                          }
                                            return res.json({
                                                success: true,
                                                message: "password is successfully updated."
                                            });
                                        });
                                      } catch (err) {
                                        return res.json({
                                            success: false,
                                            message: "find user is failed, I think."
                                        });
                                      }
                                    });

                                    // return res.json({
                                    //     success: true,
                                    //     message: "We have sent you a email with password reset link."
                                    // });
                                } catch (err) {
                                    console.log("\n\nNodemailer error >>>>: ", err);
                                    return res.json({
                                        success: false,
                                        // error: "There is something went wrong in email. Please try again."
                                        error: err
                                    });
                                }
                            });
                        } catch (err) {
                            console.log("\n\nErr - generateToken Catch() >>>>>>", err, "\n\n");
                            return res.json({
                                success: false,
                                error: err.message || err
                            });
                        }
                    });
                })
                .catch(err => {
                    console.log("\n\nErr - then Catch() >>>>>>", err, "\n\n");
                    return res.json({
                        success: false,
                        error: err.message || err
                    });
                });
    } catch (Err) {
        return res.json({
            success: false,
            error: Err.message || Err
        });
    }
};

exports.getTokenDetail = function (req, res) {
    var token = req.body.token || req.query.token || req.headers["x-access-token"];
    auth.getTokenDetail(token, function (tokenError, payload) {
        if (tokenError) {
            res.status(400).json({"error": tokenError});
        }
        res.status(200).json({"result": payload});
    })
}

/**************************************
 *
 * Helping functions
 *
 **************************************/

function generateToken(callback) {
    crypto.randomBytes(35, (err, buf) => {
        if (err) {
            console.log("\nError - crypto.randomBytes(): ", err, "\n");
            return callback(err);
        }
        var token = buf.toString("hex");
        console.log(`${buf.length} bytes of random data: ${buf.toString("hex")}`);
        User.findOne({reset_token: token}, function (findErr, resetToken) {
            // return callback(new Error("Testing Error generateToken"));
            if (findErr) {
                return callback(err);
            }
            if (!resetToken) {
                return callback(false, token);
            }

            generateToken(callback);
        });
    });
}
