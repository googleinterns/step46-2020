// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.gson.Gson;
import com.google.sps.task.Task;
import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** 
 * Servlet that returns all the information about a specific task whose corresponding entity key matches
 * the given input keyString .
 */
@WebServlet("/tasks/info")
public class TaskInfoServlet extends HttpServlet {
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String keyString = request.getParameter("key");

        Key taskKey = KeyFactory.stringToKey(keyString);

        DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
        Entity entity;
        try {
            entity = datastore.get(taskKey);
        } catch (EntityNotFoundException e) {
            System.err.println("Unable to find the entity based on the input key");
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "The entity is not found in the database");
            return;
        }

        String detail = (String) entity.getProperty("detail");
        long timestamp = (long) entity.getProperty("timestamp");
        long reward = (long) entity.getProperty("reward");
        String status = (String) entity.getProperty("status");
        String owner = (String) entity.getProperty("Owner");
        String helper = (String) entity.getProperty("Helper");
        String address = (String) entity.getProperty("Address");

        Task taskEntry = new Task(keyString, detail, timestamp, status, reward, owner, helper, address);
        System.out.println(status.equals("OPEN"));

        Gson gson = new Gson();
        String json = gson.toJson(taskEntry);
        response.setContentType("application/json;");
        response.getWriter().println(json);
    }
}