package com.luv2code.ecommerce.config;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import javax.persistence.EntityManager;
import javax.persistence.metamodel.EntityType;

import com.luv2code.ecommerce.entity.Country;
import com.luv2code.ecommerce.entity.Product;
import com.luv2code.ecommerce.entity.ProductCategory;
import com.luv2code.ecommerce.entity.State;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.rest.core.config.RepositoryRestConfiguration;
import org.springframework.data.rest.webmvc.config.RepositoryRestConfigurer;
import org.springframework.http.HttpMethod;


@Configuration
public class MyDataRestConfig implements RepositoryRestConfigurer {


   private EntityManager entityManager; 
   
   @Autowired
   public MyDataRestConfig(EntityManager theEntityManager) {
     entityManager = theEntityManager; 
   }

  @Override
  public void configureRepositoryRestConfiguration(RepositoryRestConfiguration config) {


    final HttpMethod[] theUnsupportedActions = {HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE};

    
     // disable HTTP methods for ProductCategory: PUT, POST AND DELETE
     disableHttpMethods(Product.class, config, theUnsupportedActions);
     disableHttpMethods(ProductCategory.class, config, theUnsupportedActions);
     disableHttpMethods(Country.class, config, theUnsupportedActions);
     disableHttpMethods(State.class, config, theUnsupportedActions);

     // call internal helper method 
     exposeIds(config);
    }

  private void disableHttpMethods(Class theClass, RepositoryRestConfiguration config, final HttpMethod[] theUnsupportedActions) {
    config.getExposureConfiguration()   
     .forDomainType(theClass) 
     .withItemExposure((metdata, httpMethods) -> httpMethods.disable(theUnsupportedActions))
     .withCollectionExposure((metdata, httpMethods) -> httpMethods.disable(theUnsupportedActions));
  }
    private void exposeIds(RepositoryRestConfiguration config) {
      // expose entity ids 

      // - get a list of all entity classes from the entity manager
      Set<EntityType<?>> entities = entityManager.getMetamodel().getEntities();

      // - create an array of the entity types 
      List<Class> entityClasses = new ArrayList<>(); 
 
      // - get the entity types for the entities 
      for (EntityType tempEntityType : entities) {
        entityClasses.add(tempEntityType.getJavaType()); 
      }

      // - expose the entity ids for the array of the entity/domain types 
      Class[ ] domainTypes = entityClasses.toArray(new Class[0]);
      config.exposeIdsFor(domainTypes);   

      }

    }

  


